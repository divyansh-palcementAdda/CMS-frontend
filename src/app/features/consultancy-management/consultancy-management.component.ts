import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { ConsultancyService } from '../../core/services/consultancy.service';
import { ConsultancyItem, ConsultancyPageData } from '../../core/models/consultancy.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';
import { AddConsultancyModalComponent } from './components/add-consultancy-modal/add-consultancy-modal.component';

@Component({
  selector: 'app-consultancy-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, TopbarComponent, ConfirmationModalComponent, AddConsultancyModalComponent],
  templateUrl: './consultancy-management.component.html',
  styleUrls: ['./consultancy-management.component.scss']
})
export class ConsultancyManagementComponent implements OnInit, OnDestroy {
  pageData: ConsultancyPageData | null = null;
  loading = true;
  searchTerm = '';
  
  currentPage = 1;
  pageSize = 10;
  
  private destroy$ = new Subject<void>();

  // Actions
  showAddModal = false;
  showDeleteModal = false;
  selectedConsultancy: ConsultancyItem | null = null;

  constructor(private consultancyService: ConsultancyService, private router: Router) {}

  ngOnInit() {
    this.loadData();
  }

  onView(id: number) {
    this.router.navigate(['/consultancy', id]);
  }

  onEdit(id: number) {
    this.router.navigate([], { fragment: 'edit' });
  }

  onDelete(consultancy: ConsultancyItem) {
    this.selectedConsultancy = consultancy;
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.selectedConsultancy = null;
    this.showDeleteModal = false;
  }

  openAddModal() {
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
  }

  onAddSuccess() {
    this.showAddModal = false;
    this.loadData();
  }

  confirmDelete() {
    if (this.selectedConsultancy) {
      this.loading = true;
      this.consultancyService.deleteConsultancy(this.selectedConsultancy.id).subscribe({
        next: () => {
          this.selectedConsultancy = null;
          this.showDeleteModal = false;
          this.loadData();
        },
        error: (err) => {
          console.error('Error deleting consultancy', err);
          this.loading = false;
          this.showDeleteModal = false;
        }
      });
    }
  }

  loadData() {
    this.loading = true;
    this.consultancyService.getConsultancyData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.pageData = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading consultancy data', err);
          this.loading = false;
        }
      });
  }

  get filteredConsultancies(): ConsultancyItem[] {
    if (!this.pageData) return [];
    let list = this.pageData.consultancies;

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(item => 
        item.name.toLowerCase().includes(term) ||
        item.email.toLowerCase().includes(term) ||
        item.city.toLowerCase().includes(term)
      );
    }
    return list;
  }

  get paginatedConsultancies(): ConsultancyItem[] {
    const list = this.filteredConsultancies;
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return list.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredConsultancies.length / this.pageSize) || 1;
  }

  getPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onSearchChange() {
    this.currentPage = 1;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
