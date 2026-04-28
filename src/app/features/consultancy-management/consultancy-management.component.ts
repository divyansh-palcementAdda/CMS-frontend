import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { ConsultancyService } from '../../core/services/consultancy.service';
import { ConsultancyItem, ConsultancyPageRequest, PageResponse, ConsultancyStats } from '../../core/models/consultancy.model';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
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
  pageResponse: PageResponse<ConsultancyItem> | null = null;
  loading = true;
  searchTerm = '';
  selectedFilter: string = 'TOTAL';
  
  // Backend Driven Config
  requestConfig: ConsultancyPageRequest = {
    page: 0,
    size: 10,
    sortBy: 'name',
    sortDirection: 'asc',
    search: '',
    years: []
  };
  
  // Year Filter
  availableYears: number[] = [2021, 2022, 2023, 2024, 2025, 2026];
  showYearDropdown = false;
  
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Actions
  showAddModal = false;
  showDeleteModal = false;
  selectedConsultancy: ConsultancyItem | null = null;
  showBulkUploadModal = false;
  editingConsultancyId: number | null = null;
  downloadLoading = false;

  constructor(
    public consultancyService: ConsultancyService, 
    private router: Router,
    private route: ActivatedRoute,
    private eRef: ElementRef
  ) {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.requestConfig.search = term;
      this.requestConfig.page = 0;
      this.loadData();
    });
  }

  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if(!this.eRef.nativeElement.querySelector('.year-filter-wrapper')?.contains(event.target)) {
      this.showYearDropdown = false;
    }
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const status = params['status'];
      const editId = params['id'];

      if (editId && this.route.snapshot.fragment === 'edit') {
        this.onEdit(+editId);
      }

      if (status) {
        this.setFilter(status); // also loads data
      } else {
        this.loadData();
      }
    });
  }

  onView(id: number) {
    this.router.navigate(['/consultancy', id]);
  }

  onEdit(id: number) {
    this.editingConsultancyId = id;
    this.showAddModal = true;
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
    this.editingConsultancyId = null;
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
    this.editingConsultancyId = null;
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
        error: (err: any) => {
          console.error('Error deleting consultancy', err);
          this.loading = false;
          this.showDeleteModal = false;
        }
      });
    }
  }

  loadData() {
    this.loading = true;
    this.consultancyService.getConsultancyPage(this.requestConfig)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.pageResponse = response;
          this.loading = false;
        },
        error: (err: any) => {
          console.error('Error loading consultancy data', err);
          this.loading = false;
        }
      });
  }

  setFilter(filter: string) {
    this.selectedFilter = filter;
    this.requestConfig.page = 0;
    
    // Map status string back to enum properly. DORMANT / ACTIVE / INACTIVE are direct. 
    // Wait, requirement is that TOTAL means NO STATUS FILTER.
    if (['ACTIVE', 'INACTIVE', 'DORMANT'].includes(filter.toUpperCase())) {
        this.requestConfig.status = filter.toUpperCase();
    } else {
        this.requestConfig.status = undefined; // For TOTAL or other frontend logic
    }
    
    this.loadData();
  }

  // Sorting Logic
  setSort(column: string) {
    if (this.requestConfig.sortBy === column) {
      this.requestConfig.sortDirection = this.requestConfig.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.requestConfig.sortBy = column;
      this.requestConfig.sortDirection = 'asc';
    }
    this.requestConfig.page = 0;
    this.loadData();
  }
  
  getSortIcon(column: string): string {
    if (this.requestConfig.sortBy !== column) return '';
    return this.requestConfig.sortDirection === 'asc' ? '↑' : '↓';
  }

  // Year Selection Logic
  toggleYearDropdown() {
    this.showYearDropdown = !this.showYearDropdown;
  }
  
  toggleYearSelection(year: number) {
    if(!this.requestConfig.years) this.requestConfig.years = [];
    
    const index = this.requestConfig.years.indexOf(year);
    if (index > -1) {
      this.requestConfig.years.splice(index, 1);
    } else {
      this.requestConfig.years.push(year);
    }
    this.requestConfig.page = 0;
    this.loadData();
  }
  
  isYearSelected(year: number): boolean {
    return this.requestConfig.years?.includes(year) || false;
  }

  get paginatedConsultancies(): ConsultancyItem[] {
    return this.pageResponse?.content || [];
  }

  get totalPages(): number {
    return this.pageResponse?.totalPages || 1;
  }
  
  get currentPage(): number {
    return this.pageResponse?.pageNumber || 1; // Backend returns 1-indexed for response payload
  }

  getVisiblePages(): (number | string)[] {
    const total = this.totalPages;
    const current = this.requestConfig.page + 1; // requestConfig.page is 0-indexed
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      
      if (current > 3) {
        pages.push('...');
      }

      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 2) {
        pages.push('...');
      }

      pages.push(total);
    }

    return pages;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.requestConfig.page = page - 1; // requestConfig is 0-indexed
      this.loadData();
    }
  }

  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }

  downloadExcel() {
    if (this.downloadLoading) return;
    
    this.downloadLoading = true;
    this.consultancyService.downloadExcel().subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Consultancy_Report_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.downloadLoading = false;
      },
      error: (err: any) => {
        console.error('Error downloading excel', err);
        this.downloadLoading = false;
        alert('Failed to download excel report. Please try again later.');
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
