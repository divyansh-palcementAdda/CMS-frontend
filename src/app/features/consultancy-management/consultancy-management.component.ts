import { Component, OnInit, OnDestroy, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { ConsultancyService } from '../../core/services/consultancy.service';
import { LeadSourceService } from '../../core/services/lead-source.service';
import { LocationService } from '../../core/services/location.service';
import { ConsultancyItem, ConsultancyPageRequest, PageResponse, ConsultancyStats } from '../../core/models/consultancy.model';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';
import { AddConsultancyModalComponent } from './components/add-consultancy-modal/add-consultancy-modal.component';
import { BulkUploadModalComponent } from '../../shared/components/bulk-upload-modal/bulk-upload-modal.component';
import { BulkMapModalComponent } from '../../shared/components/bulk-map-modal/bulk-map-modal.component';
import { FilterDrawerComponent } from '../../shared/components/filter-drawer/filter-drawer.component';
import { StatePreservationService } from '../../core/services/state-preservation.service';


@Component({
  selector: 'app-consultancy-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, TopbarComponent, ConfirmationModalComponent, AddConsultancyModalComponent, BulkUploadModalComponent, BulkMapModalComponent, FilterDrawerComponent],
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
    years: [],
    state: '',
    city: '',
    leadSourceId: ''
  };

  states: string[] = [];
  cities: string[] = [];
  loadingCities: boolean = false;

  // Year Filter
  availableYears: number[] = (() => {
    const currentYear = new Date().getFullYear();
    const result = [];
    for (let i = 4; i >= 0; i--) {
      result.push(currentYear - i);
    }
    return result;
  })();
  showYearDropdown = false;
  isUpdatingUrl = false;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Actions
  showAddModal = false;
  showDeleteModal = false;
  selectedConsultancy: ConsultancyItem | null = null;
  showBulkUploadModal = false;
  showBulkMapModal = false;
  editingConsultancyId: number | null = null;
  downloadLoading = false;
  showFilterDrawer = false;
  showDownloadModal = false;
  activeFilterCount = 0;
  activeLeadSources: any[] = [];
  private leadSourceService = inject(LeadSourceService);

  constructor(
    public consultancyService: ConsultancyService,
    private locationService: LocationService,
    private router: Router,
    private route: ActivatedRoute,
    private eRef: ElementRef,
    private location: Location,
    private statePreservationService: StatePreservationService
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
    if (!this.eRef.nativeElement.querySelector('.year-filter-wrapper')?.contains(event.target)) {
      this.showYearDropdown = false;
    }
  }

  parseQueryParams(params: any) {
    if (params['page'] !== undefined) {
      this.requestConfig.page = +params['page'];
    } else {
      this.requestConfig.page = 0;
    }

    if (params['size'] !== undefined) {
      this.requestConfig.size = +params['size'];
    } else {
      this.requestConfig.size = 10;
    }

    if (params['search'] !== undefined) {
      this.requestConfig.search = params['search'];
      this.searchTerm = params['search'];
    } else {
      this.requestConfig.search = '';
      this.searchTerm = '';
    }

    if (params['status'] !== undefined) {
      this.selectedFilter = params['status'].toUpperCase();
    } else {
      this.selectedFilter = 'TOTAL';
    }

    if (params['sortBy'] !== undefined) {
      this.requestConfig.sortBy = params['sortBy'];
    } else {
      this.requestConfig.sortBy = 'name';
    }

    if (params['sortDirection'] !== undefined) {
      this.requestConfig.sortDirection = params['sortDirection'];
    } else {
      this.requestConfig.sortDirection = 'asc';
    }

    if (params['years'] !== undefined && params['years']) {
      this.requestConfig.years = params['years'].split(',').map((y: string) => +y);
    } else {
      this.requestConfig.years = [];
    }

    if (params['state'] !== undefined) {
      this.requestConfig.state = params['state'];
      if (this.requestConfig.state) {
        this.loadCities(this.requestConfig.state);
      }
    } else {
      this.requestConfig.state = '';
    }

    if (params['city'] !== undefined) {
      this.requestConfig.city = params['city'];
    } else {
      this.requestConfig.city = '';
    }

    if (params['leadSourceId'] !== undefined) {
      this.requestConfig.leadSourceId = params['leadSourceId'] || '';
    } else {
      this.requestConfig.leadSourceId = '';
    }
  }

  updateUrlQueryParams() {
    const queryParams: any = {
      page: this.requestConfig.page,
      size: this.requestConfig.size,
      search: this.requestConfig.search || null,
      status: this.selectedFilter !== 'TOTAL' ? this.selectedFilter : null,
      sortBy: this.requestConfig.sortBy,
      sortDirection: this.requestConfig.sortDirection,
      years: this.requestConfig.years && this.requestConfig.years.length ? this.requestConfig.years.join(',') : null,
      state: this.requestConfig.state || null,
      city: this.requestConfig.city || null,
      leadSourceId: this.requestConfig.leadSourceId || null
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  ngOnInit() {
    this.fetchActiveLeadSources();

    this.route.queryParams.subscribe(params => {
      if (this.isUpdatingUrl) {
        return;
      }

      const editId = params['id'];
      if (editId && this.route.snapshot.fragment === 'edit') {
        this.onEdit(+editId);
      }

      this.parseQueryParams(params);
      this.loadData();
    });

    this.loadStates();
  }

  fetchActiveLeadSources() {
    this.leadSourceService.getActive().subscribe(res => {
      this.activeLeadSources = res.data;
    });
  }

  // ── Location Helpers ──────────────────────────────────────────────────

  loadStates(): void {
    this.locationService.getAllStates().subscribe({
      next: states => this.states = states,
      error: err => console.error('Error loading states', err)
    });
  }

  loadCities(state: string): void {
    this.loadingCities = true;
    this.locationService.getCitiesByState(state).subscribe({
      next: cities => {
        this.cities = cities;
        this.loadingCities = false;
      },
      error: err => {
        console.error('Error loading cities', err);
        this.loadingCities = false;
      }
    });
  }

  onStateChange(): void {
    this.requestConfig.city = '';
    this.requestConfig.page = 0;

    if (this.requestConfig.state) {
      this.loadCities(this.requestConfig.state);
    } else {
      this.cities = [];
    }
    this.loadData();
  }

  onCityChange(): void {
    this.requestConfig.page = 0;
    this.loadData();
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
    const hasRouteTrigger = this.route.snapshot.fragment === 'edit' || !!this.route.snapshot.queryParams['id'];
    this.showAddModal = false;
    this.editingConsultancyId = null;

    if (hasRouteTrigger) {
      this.location.back();
    }
  }

  onAddSuccess() {
    this.closeAddModal();
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
    this.updateActiveFilterCount();

    // Save state in URL
    this.isUpdatingUrl = true;
    this.updateUrlQueryParams();
    setTimeout(() => {
      this.isUpdatingUrl = false;
    }, 100);

    // Save state in SessionStorage (as redundant backup)
    this.statePreservationService.saveState('cms_consultancy_management_state', {
      requestConfig: this.requestConfig,
      searchTerm: this.searchTerm,
      selectedFilter: this.selectedFilter
    });

    this.consultancyService.getConsultancyPage(this.requestConfig)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.pageResponse = response;
          console.log('Response:', response);
          this.loading = false;
        },
        error: (err: any) => {
          console.error('Error loading consultancy data', err);
          this.loading = false;
        }
      });
  }

  updateActiveFilterCount() {
    let count = 0;
    if (this.requestConfig.status) count++;
    if (this.requestConfig.years && this.requestConfig.years.length > 0) count++;
    if (this.requestConfig.state) count++;
    if (this.requestConfig.city) count++;
    if (this.requestConfig.leadSourceId) count++;
    this.activeFilterCount = count;
  }

  applyFilters() {
    this.showFilterDrawer = false;
    this.requestConfig.page = 0;
    this.loadData();
  }

  resetFilters() {
    this.requestConfig.status = undefined;
    this.requestConfig.years = [];
    this.requestConfig.state = '';
    this.requestConfig.city = '';
    this.requestConfig.leadSourceId = '';
    this.selectedFilter = 'TOTAL';
    this.applyFilters();
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
    if (!this.requestConfig.years) this.requestConfig.years = [];

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

  onPageSizeChange(): void {
    this.requestConfig.size = Number(this.requestConfig.size);
    this.requestConfig.page = 0;
    this.loadData();
  }

  /** Step 1 — show confirmation modal before downloading. */
  showDownloadConfirmation() {
    if (this.downloadLoading) return;
    this.showDownloadModal = true;
  }

  /** Step 2 — user confirmed: run the filter-aware export. */
  confirmDownload() {
    this.showDownloadModal = false;
    this.downloadLoading = true;

    this.consultancyService.exportExcel(this.requestConfig)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          const timestamp = new Date().toLocaleDateString('en-IN').replace(/\//g, '-');
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Consultancy_Report_${timestamp}.xlsx`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          this.downloadLoading = false;
        },
        error: (err: any) => {
          console.error('Error downloading excel', err);
          this.downloadLoading = false;
        }
      });
  }

  cancelDownload() {
    this.showDownloadModal = false;
  }

  /** Returns a human-readable summary of active filters for the modal. */
  getFilterSummary(): string {
    const parts: string[] = [];
    if (this.requestConfig.status)   parts.push(`Status: ${this.requestConfig.status}`);
    if (this.requestConfig.years?.length) parts.push(`Years: ${this.requestConfig.years.join(', ')}`);
    if (this.requestConfig.state)    parts.push(`State: ${this.requestConfig.state}`);
    if (this.requestConfig.city)     parts.push(`City: ${this.requestConfig.city}`);
    if (this.requestConfig.leadSourceId) parts.push('Lead Source: (filtered)');
    if (this.requestConfig.search)   parts.push(`Search: "${this.requestConfig.search}"`);
    return parts.length ? parts.join(' · ') : 'No filters applied (all records)';
  }

  /** @deprecated — kept for backward compat; use showDownloadConfirmation() instead. */
  downloadExcel() {
    this.showDownloadConfirmation();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
