import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
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
import { CancellationModalComponent } from './components/cancellation-modal/cancellation-modal.component';
import { CalendarModalComponent } from '../../shared/components/calendar-modal/calendar-modal.component';


/**
 * ActiveFilters — mirrors every query param that can come in from the route.
 * All 14 filter combinations are driven purely by these fields.
 */
export interface ActiveFilters {
  [key: string]: any;    // Allow dynamic indexing for filter chips
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
  isDiscounted: boolean | null;

  // Dedicated Date Filters
  appDateRangeType: string; // 'today' | 'week' | 'month' | 'custom' | ''
  admDateRangeType: string;
  appStartDate: string;
  appEndDate: string;
  admStartDate: string;
  admEndDate: string;
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
    FilterDrawerComponent,
    CancellationModalComponent,
    CalendarModalComponent
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
    leadSourceId: '',
    isDiscounted: null,
    appDateRangeType: '',
    admDateRangeType: '',
    appStartDate: '',
    appEndDate: '',
    admStartDate: '',
    admEndDate: ''
  };

  // ── Excel Download Modal ──────────────────────────────────────────────
  showDownloadModal: boolean = false;
  downloadingExcel: boolean = false;


  showFilterDrawer = false;
  activeFilterCount = 0;

  // Calendar Modal State
  showCalendarModal = false;
  calendarTarget: 'application' | 'admission' = 'application';

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

  commissionStatuses: string[] = [
    'PENDING',
    'CALCULATED',
    'PAID',
    'PARTIALLY_PAID',
    'WAIVED',
    'DISPUTED',
    'NOT_APPLICABLE',
    'UNMAPPED'
  ];

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
  showCancellationModal: boolean = false;
  isRevokingCancellation: boolean = false;
  selectedAdmission: AdmissionItem | null = null;
  selectedAdmissionForPayment: AdmissionItem | null = null;
  selectedStudentId?: number;
  selectedStudentIdForPayment?: number;
  selectedStudentNameForPayment: string = '';
  admissionIdToDelete?: number;
  admissionIdToCancel?: number;

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
    private router: Router,
    private location: Location
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
        leadSourceId: params['leadSourceId'] || '',
        isDiscounted: params['isDiscounted'] === 'true' ? true : (params['isDiscounted'] === 'false' ? false : null),
        appDateRangeType: params['appDateRangeType'] || '',
        admDateRangeType: params['admDateRangeType'] || '',
        appStartDate: params['appStartDate'] || '',
        appEndDate: params['appEndDate'] || '',
        admStartDate: params['admStartDate'] || '',
        admEndDate: params['admEndDate'] || ''
      };
      this.searchTerm = params['search'] || '';
      this.currentPage = params['page'] ? +params['page'] : 1;
      this.updateActiveFilterCount();

      if (this.filters.state && this.states.length > 0) {
        this.loadCities(this.filters.state);
      }

      this.fetchData();

      // Check for incoming edit request
      const editId = params['id'];
      if (editId && this.route.snapshot.fragment === 'edit') {
        this.onEdit(+editId);
      }
    });

    // Debounced search — now drives URL state
    this.searchSub = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(term => {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { search: term || null, page: 1 },
        queryParamsHandling: 'merge'
      });
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
      error: (err: any) => console.error('Error loading courses', err)
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
    if (this.filters.isDiscounted !== null) count++;

    // New Date filters count
    if (this.filters.appStartDate) count++;
    if (this.filters.admStartDate) count++;

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

    // Align with backend: map the primary date for each tab to 'startDate' and 'endDate'
    const finalStartDate = this.isApplicationTab ? this.filters.appStartDate : this.filters.admStartDate;
    const finalEndDate = this.isApplicationTab ? this.filters.appEndDate : this.filters.admEndDate;

    this.sub = this.admissionService.getAdmissionsData(
      this.currentPage,
      this.pageSize,
      this.searchTerm,
      this.filters.statFilter,
      this.filters.courseId ?? undefined,
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
      finalStartDate || this.filters.startDate, // Maps to backend startDate
      finalEndDate || this.filters.endDate,     // Maps to backend endDate
      this.filters.leadSourceId,
      this.filters.appStartDate,
      this.filters.appEndDate,
      this.filters.admStartDate,
      this.filters.admEndDate,
      this.filters.isDiscounted ?? undefined
    ).subscribe({
      next: data => {
        this.pageData = data;
        this.totalPages = Math.ceil(data.totalCount / this.pageSize) || 1;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error fetching admissions', err);
        this.loading = false;
      }
    });
  }

  // ── Filter / Tab controls ─────────────────────────────────────────────

  // ── Tab State Management ───────────────────────────────────────────
  private tabStates: Record<string, any> = {};

  /** Switch the tab and preserve/restore its specific filter/search state. */
  setTab(tab: string): void {
    const currentTab = this.filters.tab || 'all';

    // 1. Save current state for the departing tab
    this.tabStates[currentTab] = {
      filters: { ...this.filters },
      searchTerm: this.searchTerm,
      currentPage: this.currentPage,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    };

    const targetTab = tab || 'all';
    const savedState = this.tabStates[targetTab];

    // 2. Prepare new query params
    const queryParams: any = {
      tab: tab || null,
      // Explicitly clear/reset search and pagination unless restored
      search: null,
      page: 1,
      // Reset basic filters that might leak
      status: null,
      source: null,
      isScholar: null,
      statFilter: null,
      courseId: null,
      session: null,
      commissionStatus: null,
      fiftyPercentFeesPaid: null,
      startDate: null,
      endDate: null,
      state: null,
      city: null,
      leadSourceId: null
    };

    // 3. If we have saved state for the target tab, restore it
    if (savedState) {
      Object.assign(queryParams, {
        search: savedState.searchTerm || null,
        page: savedState.currentPage || 1,
        status: savedState.filters.statusFilter || null,
        source: savedState.filters.source || null,
        isScholar: savedState.filters.isScholar || null,
        statFilter: savedState.filters.statFilter || null,
        courseId: savedState.filters.courseId || null,
        session: savedState.filters.session || null,
        commissionStatus: savedState.filters.commissionStatus || null,
        fiftyPercentFeesPaid: savedState.filters.fiftyPercentFeesPaid !== null ? savedState.filters.fiftyPercentFeesPaid.toString() : null,
        startDate: savedState.filters.startDate || null,
        endDate: savedState.filters.endDate || null,
        state: savedState.filters.state || null,
        city: savedState.filters.city || null,
        leadSourceId: savedState.filters.leadSourceId || null
      });
      this.searchTerm = savedState.searchTerm || '';
      this.currentPage = savedState.currentPage || 1;
      this.sortColumn = savedState.sortColumn;
      this.sortDirection = savedState.sortDirection;
    } else {
      // Clean start for this tab
      this.searchTerm = '';
      this.currentPage = 1;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
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
      leadSourceId: this.filters.leadSourceId || null,
      isDiscounted: this.filters.isDiscounted !== null ? this.filters.isDiscounted.toString() : null,
      appDateRangeType: this.filters.appDateRangeType || null,
      admDateRangeType: this.filters.admDateRangeType || null,
      appStartDate: this.filters.appStartDate || null,
      appEndDate: this.filters.appEndDate || null,
      admStartDate: this.filters.admStartDate || null,
      admEndDate: this.filters.admEndDate || null
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
      leadSourceId: '',
      isDiscounted: null,
      appDateRangeType: '',
      admDateRangeType: '',
      appStartDate: '',
      appEndDate: '',
      admStartDate: '',
      admEndDate: ''
    };
    this.searchTerm = '';
    this.applyFilters();
  }

  // ── Date Range Logic ────────────────────────────────────────────────

  onDateRangeTypeChange(type: 'application' | 'admission'): void {
    const rangeType = type === 'application' ? this.filters.appDateRangeType : this.filters.admDateRangeType;

    if (rangeType === 'custom') {
      this.calendarTarget = type;
      this.showCalendarModal = true;
      return;
    }

    if (!rangeType) {
      if (type === 'application') {
        this.filters.appStartDate = '';
        this.filters.appEndDate = '';
      } else {
        this.filters.admStartDate = '';
        this.filters.admEndDate = '';
      }
      return;
    }

    const { start, end } = this.calculateDateRange(rangeType);
    if (type === 'application') {
      this.filters.appStartDate = start;
      this.filters.appEndDate = end;
    } else {
      this.filters.admStartDate = start;
      this.filters.admEndDate = end;
    }
  }

  private calculateDateRange(type: string): { start: string; end: string } {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (type) {
      case 'today':
        break;
      case 'week':
        start.setDate(now.getDate() - now.getDay());
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }

  getSourceStyle(name: string | undefined): any {
    if (!name) return {};

    // Simple hash function to get a deterministic hue (0-360)
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);

    // Using HSL for premium pastel look (high lightness for bg, low for text)
    return {
      'background-color': `hsl(${hue}, 85%, 94%)`,
      'color': `hsl(${hue}, 85%, 25%)`,
      'border-color': `hsl(${hue}, 85%, 85%)`
    };
  }

  onCalendarApply(event: { startDate: string; endDate: string }): void {
    if (this.calendarTarget === 'application') {
      this.filters.appStartDate = event.startDate;
      this.filters.appEndDate = event.endDate;
    } else {
      this.filters.admStartDate = event.startDate;
      this.filters.admEndDate = event.endDate;
    }
    this.showCalendarModal = false;
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

  clearFilter(key: string): void {
    (this.filters as any)[key] = '';
    this.applyFilters();
  }

  // ── Computed labels & Dynamic UI ──────────────────────────────────────

  get isApplicationTab(): boolean {
    return this.filters.tab === 'applications';
  }

  get activeTabLabel(): string {
    return this.isApplicationTab ? 'Recent Applications' : 'Confirmed Admissions';
  }

  get labels(): any {
    if (this.isApplicationTab) {
      return {
        total: 'Total Applications',
        totalDesc: 'All student application records',
        direct: 'Direct App',
        directDesc: 'Applications received directly',
        indirect: 'Consultancy App',
        indirectDesc: 'Applications via partners',
        scholar: 'Scholar App',
        scholarDesc: 'Scholarship applicants',
        totalDescFull: 'Total student applications registered'
      };
    }
    return {
      total: 'Total Admissions',
      totalDesc: 'All confirmed admission records',
      direct: 'Direct Adm',
      directDesc: 'Confirmed direct admissions',
      indirect: 'Consultancy Adm',
      indirectDesc: 'Admissions via partners',
      scholar: 'Scholar Adm',
      scholarDesc: 'Confirmed scholarship students',
      totalDescFull: 'Total confirmed student admissions'
    };
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
    return !!(this.searchTerm || this.filters.source || this.filters.isScholar || this.filters.statusFilter || this.filters.courseId || this.filters.session || this.filters.state || this.filters.city || this.filters.startDate);
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
    const hasRouteTrigger = this.route.snapshot.fragment === 'edit' || !!this.route.snapshot.queryParams['id'];
    this.showAdmissionModal = false;
    this.selectedStudentId = undefined;

    if (hasRouteTrigger) {
      this.location.back();
    }
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
      error: (err: any) => {
        console.error('Error deleting admission', err);
        this.loading = false;
        this.showDeleteModal = false;
      }
    });
  }

  // ── Cancellation ──────────────────────────────────────────────────────
  onCancelAdmission(item: AdmissionItem): void {
    this.admissionIdToCancel = item.id;
    this.selectedAdmission = item;
    this.isRevokingCancellation = false;
    this.showCancellationModal = true;
  }

  onRevokeCancellation(item: AdmissionItem): void {
    this.admissionIdToCancel = item.id;
    this.selectedAdmission = item;
    this.isRevokingCancellation = true;
    this.showCancellationModal = true;
  }

  confirmCancellationAction(reason: string): void {
    if (!this.admissionIdToCancel) return;
    this.loading = true;

    const obs = this.isRevokingCancellation
      ? this.admissionService.revokeCancellation(this.admissionIdToCancel)
      : this.admissionService.cancelAdmission(this.admissionIdToCancel, reason);

    obs.subscribe({
      next: () => {
        this.showCancellationModal = false;
        this.admissionIdToCancel = undefined;
        this.selectedAdmission = null;
        this.fetchData();
      },
      error: (err: any) => {
        console.error('Error processing cancellation/revoke', err);
        this.loading = false;
        this.showCancellationModal = false;
      }
    });
  }

  // ── Fee Payment ───────────────────────────────────────────────────────

  onPay(item: AdmissionItem): void {
    this.selectedStudentIdForPayment = item.id;
    this.selectedStudentNameForPayment = item.fullName;
    this.selectedAdmissionForPayment = item;
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
    const trimmedTerm = (this.searchTerm || '').trim();
    this.searchSubject.next(trimmedTerm);
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

  // ── Excel Download ────────────────────────────────────────────────────

  /** Show the confirmation modal before download */
  openDownloadModal(): void {
    this.showDownloadModal = true;
  }

  /** Triggered when user confirms download in the modal */
  confirmDownload(): void {
    this.showDownloadModal = false;
    this.downloadingExcel = true;

    const finalStartDate = this.isApplicationTab ? this.filters.appStartDate : this.filters.admStartDate;
    const finalEndDate   = this.isApplicationTab ? this.filters.appEndDate   : this.filters.admEndDate;

    this.admissionService.exportStudents(
      this.filters.tab,
      this.filters.statusFilter,
      this.filters.source,
      this.filters.isScholar,
      this.filters.statFilter,
      this.filters.state,
      this.filters.city,
      this.filters.session,
      this.filters.commissionStatus,
      this.filters.fiftyPercentFeesPaid ?? undefined,
      finalStartDate || this.filters.startDate,
      finalEndDate   || this.filters.endDate,
      this.filters.leadSourceId,
      this.searchTerm,
      this.filters.isDiscounted ?? undefined
    ).subscribe({
      next: (blob: Blob) => {
        const tab = this.filters.tab || 'all';
        const filename = `admissions_${tab}_${new Date().toISOString().split('T')[0]}.xlsx`;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
        this.downloadingExcel = false;
      },
      error: (err: any) => {
        console.error('Export failed', err);
        this.downloadingExcel = false;
      }
    });
  }

  /** Get a summary of active filters for the download modal */
  get downloadFilterSummary(): string[] {
    const parts: string[] = [];
    if (this.filters.tab === 'Admission') parts.push('Tab: Admissions');
    else if (this.filters.tab === 'applications') parts.push('Tab: Applications');
    else parts.push('Tab: All Records');
    if (this.searchTerm) parts.push(`Search: "${this.searchTerm}"`);
    if (this.filters.session) parts.push(`Session: ${this.filters.session}`);
    if (this.filters.source === 'USER') parts.push('Source: Direct');
    else if (this.filters.source === 'CONSULTANCY') parts.push('Source: Via Consultancy');
    if (this.filters.isScholar === 'true') parts.push('Scholar: Yes');
    if (this.filters.statusFilter) parts.push(`Status: ${this.filters.statusFilter}`);
    if (this.filters.state) parts.push(`State: ${this.filters.state}`);
    if (this.filters.city) parts.push(`City: ${this.filters.city}`);
    if (this.filters.isDiscounted === true) parts.push('Discount: Discounted Only');
    return parts;
  }
}
