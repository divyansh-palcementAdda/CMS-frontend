import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { ConsultancyService } from '../../core/services/consultancy.service';
import { ConsultancyItem, ConsultancyPageData } from '../../core/models/consultancy.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';
import { AddConsultancyModalComponent } from './components/add-consultancy-modal/add-consultancy-modal.component';
import { BulkUploadModalComponent } from '../../shared/components/bulk-upload-modal/bulk-upload-modal.component';

@Component({
  selector: 'app-consultancy-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, TopbarComponent, ConfirmationModalComponent, AddConsultancyModalComponent, BulkUploadModalComponent],
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
  showBulkUploadModal = false;

  constructor(
    public consultancyService: ConsultancyService, 
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const status = params['status'];
      if (status) {
        this.loadFilteredData(status);
      } else {
        this.loadData();
      }
    });
  }

  loadFilteredData(status: string) {
    this.loading = true;
    const obs = status.toUpperCase() === 'DELETED' 
      ? this.consultancyService.getConsultanciesByStatusAndDeleted('DELETED', true)
      : this.consultancyService.getConsultanciesByStatus(status);

    obs.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.pageData = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading filtered consultancy data', err);
          this.loading = false;
        }
      });
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

  onBulkUploadSuccess(result: any) {
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
