import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AdmissionPageData, AdmissionItem } from '../../core/models/admission.model';
import { AdmissionService } from '../../core/services/admission.service';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';
import { AdmissionFormModalComponent } from './components/admission-form-modal/admission-form-modal.component';
import { FeePaymentModalComponent } from './components/fee-payment-modal/fee-payment-modal.component';
import { BulkUploadModalComponent } from '../../shared/components/bulk-upload-modal/bulk-upload-modal.component';
import { LocationService } from '../../core/services/location.service';
import { FilterDrawerComponent } from '../../shared/components/filter-drawer/filter-drawer.component';
import { LeadSourceService } from '../../core/services/lead-source.service';


/**
 * ActiveFilters — mirrors every query param that can come in from the route.
 * All 14 filter combinations are driven purely by these fields.
 */
interface ActiveFilters {
  tab: string;           // '' | 'Admission' | 'applications'
  statusFilter: string;  // '' | 'CANCELLED'
  source: string;        // '' | 'USER' | 'CONSULTANCY'
  isScholar: string;     // '' | 'true' | 'false'
  statFilter: string;    // '' | 'DIRECT' | 'INDIRECT' | 'SCHOLAR' | ...
  state: string;
  city: string;

  // New Advanced Filters
  courseId: number | null;
  session: string;
  commissionStatus: string;
  fiftyPercentFeesPaid: boolean | null;
  startDate: string;
  endDate: string;
  leadSourceId: string;
}

@Component({
  selector: 'app-admission-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    TopbarComponent,
    ConfirmationModalComponent,
    AdmissionFormModalComponent,
    FeePaymentModalComponent,
    BulkUploadModalComponent,
    FilterDrawerComponent
  ],
  templateUrl: './admission-management.component.html',
  styleUrl: './admission-management.component.scss'
})
export class AdmissionManagementComponent implements OnInit, OnDestroy {

  pageData: AdmissionPageData | null = null;
  searchTerm: string = '';
  loading: boolean = true;

  private sub: Subscription | null = null;
  private routeSub: Subscription | null = null;
  private searchSub: Subscription | null = null;
  private searchSubject = new Subject<string>();

  // ── Active filters (all driven by queryParams) ────────────────────────
  filters: ActiveFilters = {
    tab: '',
    statusFilter: '',
    source: '',
    isScholar: '',
    statFilter: '',
    state: '',
    city: '',
    courseId: null,
    session: '',
    commissionStatus: '',
    fiftyPercentFeesPaid: null,
    startDate: '',
    endDate: '',
    leadSourceId: ''
  };


  showFilterDrawer = false;
  activeFilterCount = 0;

  courses: any[] = [];
  sessions: string[] = (() => {
    const currentYear = new Date().getFullYear();
    const result = [];
    for (let i = 4; i >= 0; i--) {
      result.push((currentYear - i).toString());
    }
    return result;
  })();


  activeLeadSources: any[] = [];
  private leadSourceService = inject(LeadSourceService);

  commissionStatuses: string[] = ['UNPAID', 'PARTIAL_PAID', 'PAID'];

  states: string[] = [];
  cities: string[] = [];
  loadingCities: boolean = false;

  // ── Sorting ───────────────────────────────────────────────────────────
  sortColumn: string = '';
  sortDirection: string = '';

  // ── Pagination ────────────────────────────────────────────────────────
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;

  // ── Modal state ───────────────────────────────────────────────────────
  showDeleteModal: boolean = false;
  showAdmissionModal: boolean = false;
  showBulkUploadModal: boolean = false;
  showBulkUpdateEnrollmentModal: boolean = false;
  showBulkUpdateAdmissionDateModal: boolean = false;
  showPaymentModal: boolean = false;
  selectedAdmission: AdmissionItem | null = null;
  selectedStudentId?: number;
  selectedStudentIdForPayment?: number;
  selectedStudentNameForPayment: string = '';
  admissionIdToDelete?: number;

  enrollmentUpdateService = {
    bulkUpload: (file: File) => this.admissionService.bulkUpdateEnrollment(file),
    downloadTemplate: () => this.admissionService.downloadEnrollmentTemplate()
  };

  admissionDateUpdateService = {
    bulkUpload: (file: File) => this.admissionService.bulkUpdateAdmissionDate(file),
    downloadTemplate: () => this.admissionService.downloadAdmissionDateTemplate()
  };

  constructor(
    public admissionService: AdmissionService,
    private locationService: LocationService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  // ── Lifecycle ─────────────────────────────────────────────────────────

  ngOnInit(): void {
    // Subscribe to queryParams — whenever the URL changes, re-read filters and fetch
    this.routeSub = this.route.queryParams.subscribe(params => {
      this.filters = {
        tab: params['tab'] || '',
        statusFilter: params['status'] || '',
        source: params['source'] || '',
        isScholar: params['isScholar'] || '',
        statFilter: params['statFilter'] || '',
        state: params['state'] || '',
        city: params['city'] || '',
        courseId: params['courseId'] ? +params['courseId'] : null,
        session: params['session'] || '',
        commissionStatus: params['commissionStatus'] || '',
        fiftyPercentFeesPaid: params['fiftyPercentFeesPaid'] === 'true' ? true : (params['fiftyPercentFeesPaid'] === 'false' ? false : null),
        startDate: params['startDate'] || '',
        endDate: params['endDate'] || '',
        leadSourceId: params['leadSourceId'] || ''
      };

      this.updateActiveFilterCount();

      if (this.filters.state && this.states.length > 0) {
        this.loadCities(this.filters.state);
      }

      this.currentPage = 1;
      this.fetchData();

      // Check for incoming edit request
      const editId = params['id'];
      if (editId && this.route.snapshot.fragment === 'edit') {
        this.onEdit(+editId);
      }
    });

    // Debounced search
    this.searchSub = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm = term;
      this.currentPage = 1;
      this.fetchData();
    });

    this.loadStates();
    this.loadCourses();
    this.fetchActiveLeadSources();
  }

  fetchActiveLeadSources() {
    this.leadSourceService.getActive().subscribe(res => {
      this.activeLeadSources = res.data;
    });
  }

  loadCourses(): void {
    this.admissionService.getActiveCourses().subscribe({
      next: (courses: any) => {
        this.courses = courses.data || courses;
      },
      error: err => console.error('Error loading courses', err)
    });
  }

  updateActiveFilterCount(): void {
    let count = 0;
    if (this.filters.source) count++;
    if (this.filters.isScholar) count++;
    if (this.filters.statusFilter) count++;
    if (this.filters.state) count++;
    if (this.filters.city) count++;
    if (this.filters.courseId) count++;
    if (this.filters.session) count++;
    if (this.filters.commissionStatus) count++;
    if (this.filters.fiftyPercentFeesPaid !== null) count++;
    if (this.filters.startDate) count++;
    if (this.filters.endDate) count++;
    if (this.filters.leadSourceId) count++;
    this.activeFilterCount = count;
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.routeSub?.unsubscribe();
    this.searchSub?.unsubscribe();
  }

  // ── Data Fetching ─────────────────────────────────────────────────────

  /**
   * Single unified fetch — all filter combinations are forwarded to the
   * backend via getAdmissionsData(). No client-side post-filtering.
   */
  fetchData(): void {
    this.loading = true;
    this.sub?.unsubscribe();

    this.sub = this.admissionService.getAdmissionsData(
      this.currentPage,
      this.pageSize,
      this.searchTerm,
      this.filters.statFilter,
      undefined,              // courseId — not used yet
      this.sortColumn,
      this.sortDirection,
      this.filters.tab,
      this.filters.statusFilter,
      this.filters.source,
      this.filters.isScholar,
      this.filters.state,
      this.filters.city,
      this.filters.session,
      this.filters.commissionStatus,
      this.filters.fiftyPercentFeesPaid ?? undefined,
      this.filters.startDate,
      this.filters.endDate,
      this.filters.leadSourceId
    ).subscribe({
      next: data => {
        this.pageData = data;
        console.log(data);
        this.totalPages = Math.ceil(data.totalCount / this.pageSize) || 1;
        this.loading = false;
      },
      error: err => {
        console.error('Error fetching admissions', err);
        this.loading = false;
      }
    });
  }

  // ── Filter / Tab controls ─────────────────────────────────────────────

  /** Switch the tab and clear source/scholar/status filters. Sync to URL. */
  setTab(tab: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        tab: tab || null,
        status: null,
        source: null,
        isScholar: null
      },
      queryParamsHandling: 'merge'
    });
    // routeSub handles fetchData automatically
  }

  /** Dismiss / clear the status filter from URL. */
  setStatus(status: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { status: status || null },
      queryParamsHandling: 'merge'
    });
  }

  /** Legacy stat card filter (DIRECT / INDIRECT / SCHOLAR / etc.) */
  onStatFilter(filter: string): void {
    const newFilter = this.filters.statFilter === filter ? '' : filter;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { statFilter: newFilter || null },
      queryParamsHandling: 'merge'
    });
  }

  applyFilters(): void {
    this.showFilterDrawer = false;
    const queryParams: any = {
      courseId: this.filters.courseId || null,
      session: this.filters.session || null,
      commissionStatus: this.filters.commissionStatus || null,
      fiftyPercentFeesPaid: this.filters.fiftyPercentFeesPaid !== null ? this.filters.fiftyPercentFeesPaid.toString() : null,
      startDate: this.filters.startDate || null,
      endDate: this.filters.endDate || null,
      state: this.filters.state || null,
      city: this.filters.city || null,
      source: this.filters.source || null,
      isScholar: this.filters.isScholar || null,
      leadSourceId: this.filters.leadSourceId || null
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  resetFilters(): void {
    this.filters = {
      ...this.filters,
      source: '',
      isScholar: '',
      statusFilter: '',
      state: '',
      city: '',
      courseId: null,
      session: '',
      commissionStatus: '',
      fiftyPercentFeesPaid: null,
      startDate: '',
      endDate: '',
      leadSourceId: ''
    };
    this.applyFilters();
  }

  // ── Location Helpers ──────────────────────────────────────────────────

  loadStates(): void {
    this.locationService.getAllStates().subscribe({
      next: states => {
        this.states = states;
        // If state already in filters (from URL), load its cities
        if (this.filters.state) {
          this.loadCities(this.filters.state);
        }
      },
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
    // Reset city when state changes
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        state: this.filters.state || null,
        city: null
      },
      queryParamsHandling: 'merge'
    });

    if (this.filters.state) {
      this.loadCities(this.filters.state);
    } else {
      this.cities = [];
    }
  }

  onCityChange(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { city: this.filters.city || null },
      queryParamsHandling: 'merge'
    });
  }

  // ── Computed labels ───────────────────────────────────────────────────

  get activeTabLabel(): string {
    const labels: Record<string, string> = {
      'Admission': 'Admissions',
      'applications': 'Applications'
    };
    return labels[this.filters.tab] ?? 'All Records';
  }

  /** Human-readable description of all active filters for the header badge */
  get activeFilterSummary(): string {
    const parts: string[] = [];
    if (this.filters.source === 'USER') parts.push('Direct');
    if (this.filters.source === 'CONSULTANCY') parts.push('Via Consultancy');
    if (this.filters.isScholar === 'true') parts.push('Scholar');
    if (this.filters.statusFilter) parts.push(this.filters.statusFilter);
    return parts.join(' · ');
  }

  get hasActiveFilters(): boolean {
    return !!(this.filters.source || this.filters.isScholar || this.filters.statusFilter);
  }

  // ── Navigation ────────────────────────────────────────────────────────

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  onView(id: number): void {
    this.router.navigate(['/admissions', id]);
  }

  // ── Admission Modal ───────────────────────────────────────────────────

  openAddAdmission(): void {
    this.selectedStudentId = undefined;
    this.showAdmissionModal = true;
  }

  onEdit(id: number): void {
    this.selectedStudentId = id;
    this.showAdmissionModal = true;
  }

  closeAdmissionModal(): void {
    this.showAdmissionModal = false;
    this.selectedStudentId = undefined;
  }

  onBulkUploadSuccess(_result: any): void {
    this.fetchData();
  }

  // ── Delete ────────────────────────────────────────────────────────────

  onDelete(item: AdmissionItem): void {
    this.admissionIdToDelete = item.id;
    this.selectedAdmission = item;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.admissionIdToDelete = undefined;
  }

  confirmDelete(): void {
    if (!this.admissionIdToDelete) return;
    this.loading = true;
    this.admissionService.deleteAdmission(this.admissionIdToDelete).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.selectedAdmission = null;
        this.admissionIdToDelete = undefined;
        this.fetchData();
      },
      error: err => {
        console.error('Error deleting admission', err);
        this.loading = false;
        this.showDeleteModal = false;
      }
    });
  }

  // ── Fee Payment ───────────────────────────────────────────────────────

  onPay(item: AdmissionItem): void {
    this.selectedStudentIdForPayment = item.id;
    this.selectedStudentNameForPayment = item.fullName;
    this.showPaymentModal = true;
  }

  onPaymentSaved(): void {
    this.fetchData();
  }

  // ── Fee Status Toggle ─────────────────────────────────────────────────

  toggleFeeStatus(item: AdmissionItem, newStatus: string): void {
    if (item.feeStatus === newStatus) return;
    const prevStatus = item.feeStatus;
    item.feeStatus = newStatus;

    this.admissionService.updateFeeStatus(item.id, newStatus === 'Paid').subscribe({
      next: res => {
        if (res === null) {
          item.feeStatus = prevStatus;
          console.warn('Backend update failed, reverting optimistic UI change.');
        }
      }
    });
  }

  // ── Search ────────────────────────────────────────────────────────────

  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  // ── Sorting ───────────────────────────────────────────────────────────

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.fetchData();
  }

  // ── Pagination ────────────────────────────────────────────────────────

  get paginatedAdmissions(): AdmissionItem[] {
    return this.pageData?.admissions ?? [];
  }

  onPageSizeChange(): void {
    this.pageSize = Number(this.pageSize);
    this.currentPage = 1;
    this.fetchData();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.fetchData();
    }
  }

  getVisiblePages(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;
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
}
