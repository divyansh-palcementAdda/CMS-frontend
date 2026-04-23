import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { InstitutionService } from '../../core/services/institution.service';
import { InstitutionPageData, InstitutionItem } from '../../core/models/institution.model';

import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';
import { AddInstitutionModalComponent } from './components/add-institution-modal/add-institution-modal.component';
import { BulkUploadModalComponent } from '../../shared/components/bulk-upload-modal/bulk-upload-modal.component';

@Component({
  selector: 'app-institution-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SidebarComponent, TopbarComponent, ConfirmationModalComponent, AddInstitutionModalComponent, BulkUploadModalComponent],
  templateUrl: './institution-management.component.html',
  styleUrl: './institution-management.component.scss'
})
export class InstitutionManagementComponent implements OnInit, OnDestroy {
  loading = true;
  pageData: InstitutionPageData | null = null;
  filteredInstitutions: InstitutionItem[] = [];
  paginatedInstitutions: InstitutionItem[] = [];
  searchTerm: string = '';
  sortOrder: 'asc' | 'desc' | 'none' = 'asc';

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  private sub!: Subscription;
  private courseSub?: Subscription;

  expandedInstId: number | null = null;
  loadingCourses = false;

  // Actions
  showDeleteModal = false;
  showAddModal = false;
  selectedInstitution: InstitutionItem | null = null;
  showBulkUploadModal = false;
  editingInstitutionId: number | null = null;
  showCourseModal = false;
  selectedInstName: string = '';
  groupedCourses: { [key: string]: any[] } = {};
  courseTypes: string[] = [];

  constructor(
    public institutionService: InstitutionService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const status = params['status'];
      if (status) {
        this.fetchFilteredData(status);
      } else {
        this.fetchData();
      }
    });
  }

  fetchFilteredData(status: string) {
    this.loading = true;
    this.sub = this.institutionService.getInstitutionsByStatus(status).subscribe(data => {
      console.log(data);
      this.pageData = data;
      this.filteredInstitutions = data.institutions;
      this.calculatePagination();
      this.loading = false;
    });
  }


  toggleSort() {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.applyFiltersAndSort();
  }


  applyFiltersAndSort() {
    if (!this.pageData) return;

    let result = [...this.pageData.institutions];

    // Filter by search
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(inst =>
        inst.name.toLowerCase().includes(term) ||
        inst.code.toLowerCase().includes(term) ||
        inst.course.toLowerCase().includes(term)
      );
    }

    // Sort by name (A-Z / Z-A)
    if (this.sortOrder === 'asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (this.sortOrder === 'desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    this.filteredInstitutions = result;
    this.currentPage = 1;
    this.calculatePagination();
  }



  onView(id: number | undefined) {
    if (id) {
      this.router.navigate(['/institutions', id]);
    }
  }

  onEdit(id: number | undefined) {
    if (id) {
      this.showAddModal = true;
    }
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

  openAddModal() {
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
  }

  onAddSuccess() {
    this.fetchData();
  }

  onBulkUploadSuccess(result: any) {
    this.fetchData();
  }

  fetchData() {
    this.loading = true;
    this.sub = this.institutionService.getInstitutionsData().subscribe(data => {
      console.log(data);
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

  openCourseModal(inst: InstitutionItem, event: Event) {
    event.stopPropagation();
    if (inst.course === 'No course') return;

    this.selectedInstName = inst.name;
    const id = inst.id || 0;
    this.expandedInstId = id;
    this.showCourseModal = true;
    this.loadingCourses = true;
    this.groupedCourses = {};
    this.courseTypes = [];

    if (this.courseSub) {
      this.courseSub.unsubscribe();
    }

    this.courseSub = this.institutionService.getInstitutionCourses(id).subscribe(courses => {
      if (this.expandedInstId === id) {
        // Group courses by courseTypeName
        const grouped = courses.reduce((acc: any, course: any) => {
          const type = course.courseTypeName || course.courseType || 'General';
          if (!acc[type]) acc[type] = [];
          acc[type].push(course);
          return acc;
        }, {});

        this.groupedCourses = grouped;
        this.courseTypes = Object.keys(grouped).sort();
        this.loadingCourses = false;
      }
    });
  }

  closeCourseModal() {
    this.showCourseModal = false;
    this.expandedInstId = null;
    this.groupedCourses = {};
    this.courseTypes = [];
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
    if (this.courseSub) this.courseSub.unsubscribe();
  }
}
