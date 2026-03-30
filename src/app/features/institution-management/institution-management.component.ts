import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { InstitutionService } from '../../core/services/institution.service';
import { InstitutionPageData, InstitutionItem } from '../../core/models/institution.model';

import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-institution-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SidebarComponent, TopbarComponent, ConfirmationModalComponent],
  templateUrl: './institution-management.component.html',
  styleUrl: './institution-management.component.scss'
})
export class InstitutionManagementComponent implements OnInit, OnDestroy {
  loading = true;
  pageData: InstitutionPageData | null = null;
  filteredInstitutions: InstitutionItem[] = [];
  paginatedInstitutions: InstitutionItem[] = [];
  searchTerm: string = '';
  
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  private sub!: Subscription;
  private courseSub?: Subscription;

  expandedInstId: number | null = null;
  coursesForExpandedInst: { id: number, name: string }[] = [];
  loadingCourses = false;

  // Actions
  showDeleteModal = false;
  selectedInstitution: InstitutionItem | null = null;

  constructor(
    private institutionService: InstitutionService,
    private router: Router
  ) {}

  ngOnInit() {
    this.fetchData();
  }

  onView(id: number | undefined) {
    if (id) {
      this.router.navigate(['/institutions', id]);
    }
  }

  onEdit(id: number | undefined) {
    this.router.navigate([], { fragment: 'edit' });
  }

  onDelete(inst: InstitutionItem) {
    this.selectedInstitution = inst;
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.selectedInstitution = null;
    this.showDeleteModal = false;
  }

  confirmDelete() {
    if (this.selectedInstitution && this.selectedInstitution.id) {
      this.loading = true;
      this.institutionService.deleteInstitution(this.selectedInstitution.id).subscribe({
        next: () => {
          this.selectedInstitution = null;
          this.showDeleteModal = false;
          this.fetchData();
        },
        error: (err) => {
          console.error('Error deleting institution', err);
          this.loading = false;
          this.showDeleteModal = false;
        }
      });
    }
  }

  fetchData() {
    this.loading = true;
    this.sub = this.institutionService.getInstitutionsData().subscribe(data => {
      this.pageData = data;
      this.filteredInstitutions = data.institutions;
      this.calculatePagination();
      this.loading = false;
    });
  }

  onSearchChange() {
    if (!this.pageData) return;
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredInstitutions = this.pageData.institutions;
    } else {
      this.filteredInstitutions = this.pageData.institutions.filter(inst => 
        inst.name.toLowerCase().includes(term) || 
        inst.code.toLowerCase().includes(term) ||
        inst.course.toLowerCase().includes(term)
      );
    }
    this.currentPage = 1;
    this.calculatePagination();
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.filteredInstitutions.length / this.pageSize) || 1;
    if (this.currentPage > this.totalPages) this.currentPage = 1;
    
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.paginatedInstitutions = this.filteredInstitutions.slice(startIndex, startIndex + this.pageSize);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.calculatePagination();
    }
  }

  getPagesArray(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  toggleCourseDropdown(inst: InstitutionItem, event: Event) {
    event.stopPropagation();
    if (inst.course === 'No course') return;
    
    // Toggle close if already open
    if (this.expandedInstId === inst.id) {
      this.expandedInstId = null;
      return;
    }
    
    const id = inst.id || 0;
    this.expandedInstId = id;
    this.loadingCourses = true;
    this.coursesForExpandedInst = [];
    
    if (this.courseSub) {
      this.courseSub.unsubscribe();
    }
    
    this.courseSub = this.institutionService.getInstitutionCourses(id).subscribe(courses => {
      // Avoid race conditions
      if (this.expandedInstId === id) {
        this.coursesForExpandedInst = courses;
        this.loadingCourses = false;
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    // Close dropdown when clicking anywhere else on document
    this.expandedInstId = null;
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
    if (this.courseSub) this.courseSub.unsubscribe();
  }
}
