import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, Subject, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AdmissionPageData, AdmissionItem } from '../../core/models/admission.model';
import { AdmissionService } from '../../core/services/admission.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';
import { AdmissionFormModalComponent } from './components/admission-form-modal/admission-form-modal.component';
import { FeePaymentModalComponent } from './components/fee-payment-modal/fee-payment-modal.component';
import { BulkUploadModalComponent } from '../../shared/components/bulk-upload-modal/bulk-upload-modal.component';
import { LocationService } from '../../core/services/location.service';
import { FilterDrawerComponent } from '../../shared/components/filter-drawer/filter-drawer.component';
import { LeadSourceService } from '../../core/services/lead-source.service';
import { ConsultancyService } from '../../core/services/consultancy.service';
import { UserService } from '../../core/services/user.service';
import { CourseService } from '../../core/services/course.service';
import { CancellationModalComponent } from './components/cancellation-modal/cancellation-modal.component';
import { CalendarModalComponent } from '../../shared/components/calendar-modal/calendar-modal.component';
import { SearchableSelectorModalComponent } from '../../shared/components/searchable-selector-modal/searchable-selector-modal.component';
import { CourseTypeService } from '../../core/services/course-type.service';
import { MultiSelectModalComponent } from '../../shared/components/multi-select-modal/multi-select-modal.component';


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
  states: string[];
  cities: string[];
  courseTypes: string[];

  // New Advanced Filters
  courseId: number | null;
  session: string;
  commissionStatus: string;
  fiftyPercentFeesPaid: boolean | null;
  startDate: string;
  endDate: string;
  leadSourceId: string;
  isDiscounted: boolean | null;
  consultancyId: number | null;  // Filter by consultancy
  userId: number | null;          // Filter by counselor (admitted-by user)
  showOnlyPaid: boolean | null;
  showOnlyFoc: boolean | null;
  showOnlySbs: boolean | null;

  // Dedicated Date Filters
  appDateRangeType: string; // 'today' | 'week' | 'month' | 'custom' | ''
  admDateRangeType: string;
  appStartDate: string;
  appEndDate: string;
  admStartDate: string;
  admEndDate: string;

  sessions: string[];
  admissionTypes: string[];
  leadSources: string[];
  userIds: number[];
  consultancyIds: number[];
  courseIds: number[];
  duplicateOnly: boolean | null;
  excludeDuplicate: boolean | null;
  includeDuplicate: boolean | null;
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
    CalendarModalComponent,
    MultiSelectModalComponent
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
    states: [],
    cities: [],
    courseTypes: [],
    courseId: null,
    session: '',
    commissionStatus: '',
    fiftyPercentFeesPaid: null,
    startDate: '',
    endDate: '',
    leadSourceId: '',
    isDiscounted: null,
    consultancyId: null,
    userId: null,
    showOnlyPaid: null,
    showOnlyFoc: null,
    showOnlySbs: null,
    appDateRangeType: '',
    admDateRangeType: '',
    appStartDate: '',
    appEndDate: '',
    admStartDate: '',
    admEndDate: '',
    sessions: [],
    admissionTypes: [],
    leadSources: [],
    userIds: [],
    consultancyIds: [],
    courseIds: [],
    duplicateOnly: null,
    excludeDuplicate: true,
    includeDuplicate: null
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
  consultancies: any[] = [];
  users: any[] = [];
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
  private consultancyService = inject(ConsultancyService);
  private userService = inject(UserService);
  private courseService = inject(CourseService);
  public authService = inject(AuthService);
  private courseTypeService = inject(CourseTypeService);
  private notificationService = inject(NotificationService);

  dropdowns: {
    state: boolean,
    city: boolean,
    courseType: boolean,
    session: boolean,
    admissionType: boolean,
    leadSource: boolean
  } = {
      state: false,
      city: false,
      courseType: false,
      session: false,
      admissionType: false,
      leadSource: false
    };

  searchTerms: {
    state: string,
    city: string,
    courseType: string,
    session: string,
    admissionType: string,
    leadSource: string
  } = {
      state: '',
      city: '',
      courseType: '',
      session: '',
      admissionType: '',
      leadSource: ''
    };

  admissionTypesList: { value: string, name: string }[] = [
    { value: 'DIRECT', name: 'Direct' },
    { value: 'INDIRECT', name: 'Indirect' },
    { value: 'UNMAPPED', name: 'Unmapped' },
    { value: 'CONFIRMED', name: 'Confirmed' },
    { value: 'CANCELLED_APP', name: 'Cancelled Applications' },
    { value: 'CANCELLED_ADM', name: 'Cancelled Admissions' },
    { value: 'REMAINING_APP', name: 'Remaining Applications' },
    { value: 'TOTAL_ADMISSIONS', name: 'Total Admissions' },
    { value: 'ALL_APPLICATIONS', name: 'All Applications' },
    { value: 'SCHOLAR', name: 'Scholar' },
    { value: 'FOC', name: 'FOC' },
    { value: 'SBS', name: 'SBS' }
  ];
  courseTypes: any[] = [];

  // Searchable Selector Modal State
  activeModal: 'user' | 'consultancy' | 'course' | null = null;
  modalItems: any[] = [];
  modalLoading: boolean = false;
  modalSearchText: string = '';
  modalCurrentPage: number = 1;
  modalTotalPages: number = 1;
  modalTotalElements: number = 0;
  modalPageSize: number = 10;

  // ── Report Modal State ────────────────────────────────────────────────
  showReportModal: boolean = false;
  reportModalMessage: string = '';
  selectedAdmissionForReport: AdmissionItem | null = null;
  targetReportStatus: string = '';

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

  // ── Duplicate Application Toggle Modal State ─────────────────────────
  showDuplicateConfirmModal: boolean = false;
  duplicateConfirmTitle: string = '';
  duplicateConfirmMessage: string = '';
  duplicateConfirmConfirmText: string = '';
  duplicateConfirmMode: 'mark' | 'unmark' = 'mark';
  duplicateRemarksInput: string = '';
  selectedStudentForDuplicateToggle: AdmissionItem | null = null;

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
      const isFocOrSbs = params['status'] === 'FOC' || params['status'] === 'SBS';
      this.filters = {
        tab: params['tab'] || '',
        statusFilter: isFocOrSbs ? '' : (params['status'] || ''),
        source: params['source'] || '',
        isScholar: params['isScholar'] || '',
        statFilter: isFocOrSbs ? params['status'] : (params['statFilter'] || ''),
        state: params['state'] || '',
        city: params['city'] || '',
        states: params['states'] ? params['states'].split(',') : [],
        cities: params['cities'] ? params['cities'].split(',') : [],
        courseTypes: params['courseTypes'] ? params['courseTypes'].split(',') : [],
        courseId: params['courseId'] ? +params['courseId'] : null,
        session: params['session'] || '',
        commissionStatus: params['commissionStatus'] || '',
        fiftyPercentFeesPaid: params['fiftyPercentFeesPaid'] === 'true' ? true : (params['fiftyPercentFeesPaid'] === 'false' ? false : null),
        startDate: params['startDate'] || '',
        endDate: params['endDate'] || '',
        leadSourceId: params['leadSourceId'] || '',
        isDiscounted: params['isDiscounted'] === 'true' ? true : (params['isDiscounted'] === 'false' ? false : null),
        consultancyId: params['consultancyId'] ? +params['consultancyId'] : null,
        userId: params['userId'] ? +params['userId'] : null,
        showOnlyPaid: params['showOnlyPaid'] === 'true' ? true : (params['showOnlyPaid'] === 'false' ? false : null),
        showOnlyFoc: params['showOnlyFoc'] === 'true' ? true : (params['showOnlyFoc'] === 'false' ? false : null),
        showOnlySbs: params['showOnlySbs'] === 'true' ? true : (params['showOnlySbs'] === 'false' ? false : null),
        appDateRangeType: params['appDateRangeType'] || '',
        admDateRangeType: params['admDateRangeType'] || '',
        appStartDate: params['appStartDate'] || '',
        appEndDate: params['appEndDate'] || '',
        admStartDate: params['admStartDate'] || '',
        admEndDate: params['admEndDate'] || '',
        sessions: params['sessions'] ? params['sessions'].split(',') : [],
        admissionTypes: params['admissionTypes'] ? params['admissionTypes'].split(',') : [],
        leadSources: params['leadSources'] ? params['leadSources'].split(',') : [],
        userIds: params['userIds'] ? params['userIds'].split(',').filter((x: string) => x.trim() !== '').map((id: string) => +id) : [],
        consultancyIds: params['consultancyIds'] ? params['consultancyIds'].split(',').filter((x: string) => x.trim() !== '').map((id: string) => +id) : [],
        courseIds: params['courseIds'] ? params['courseIds'].split(',').filter((x: string) => x.trim() !== '').map((id: string) => +id) : [],
        duplicateOnly: params['duplicateOnly'] === 'true' ? true : (params['duplicateOnly'] === 'false' ? false : null),
        excludeDuplicate: params['excludeDuplicate'] === 'true' ? true : (params['excludeDuplicate'] === 'false' ? false : (params['duplicateOnly'] === 'true' || params['includeDuplicate'] === 'true' ? false : true)),
        includeDuplicate: params['includeDuplicate'] === 'true' ? true : (params['includeDuplicate'] === 'false' ? false : null)
      };
      this.searchTerm = params['search'] || '';
      this.currentPage = params['page'] ? +params['page'] : 1;
      this.updateActiveFilterCount();

      if (this.filters.states && this.filters.states.length > 0 && this.states.length > 0) {
        this.loadCitiesForSelectedStates();
      } else if (this.filters.state && this.states.length > 0) {
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
    this.loadConsultancies();
    this.loadUsers();
    this.loadActiveCourseTypes();
  }

  fetchActiveLeadSources() {
    this.leadSourceService.getActive().subscribe(res => {
      this.activeLeadSources = res.data;
    });
  }

  modalSelectionCache: Map<any, any> = new Map();

  cacheSelectedItem(item: any) {
    if (!item) return;
    const id = this.getItemId(item);
    if (id !== null && id !== undefined) {
      this.modalSelectionCache.set(id, item);
    }
  }

  getItemId(item: any): any {
    if (!item) return null;
    if (item.userId !== undefined && item.userId !== null) return item.userId;
    if (item.courseId !== undefined && item.courseId !== null) return item.courseId;
    return item.id;
  }

  getSelectedUsers(): any[] {
    if (!this.filters.userIds) return [];
    return this.filters.userIds.map(id => this.modalSelectionCache.get(id) || { id, userId: id, fullName: `User ID: ${id}` });
  }

  getSelectedConsultancies(): any[] {
    if (!this.filters.consultancyIds) return [];
    return this.filters.consultancyIds.map(id => this.modalSelectionCache.get(id) || { id, name: `Consultancy ID: ${id}` });
  }

  getSelectedCourses(): any[] {
    if (!this.filters.courseIds) return [];
    return this.filters.courseIds.map(id => this.modalSelectionCache.get(id) || { id, courseId: id, name: `Course ID: ${id}` });
  }

  loadConsultancies(): void {
    this.consultancyService.getConsultanciesByStatusAndDeleted('ACTIVE', false).subscribe({
      next: (res: any) => {
        this.consultancies = res?.consultancies || [];
        this.consultancies.forEach(c => this.cacheSelectedItem(c));
      },
      error: (err: any) => console.error('Error loading consultancies', err)
    });
  }

  loadUsers(): void {
    this.userService.getUsersData().subscribe({
      next: (res: any) => {
        this.users = res?.users || [];
        this.users.forEach(u => this.cacheSelectedItem(u));
      },
      error: (err: any) => console.error('Error loading users', err)
    });
  }

  loadCourses(): void {
    this.admissionService.getActiveCourses().subscribe({
      next: (courses: any) => {
        this.courses = courses.data || courses;
        this.courses.forEach(c => this.cacheSelectedItem(c));
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
    if (this.filters.consultancyId) count++;
    if (this.filters.userId) count++;
    if (this.filters.showOnlyPaid !== null) count++;
    if (this.filters.showOnlyFoc !== null) count++;
    if (this.filters.showOnlySbs !== null) count++;

    // New Date filters count
    if (this.filters.appStartDate) count++;
    if (this.filters.admStartDate) count++;

    if (this.filters.states && this.filters.states.length > 0) count++;
    if (this.filters.cities && this.filters.cities.length > 0) count++;
    if (this.filters.courseTypes && this.filters.courseTypes.length > 0) count++;

    if (this.filters.sessions && this.filters.sessions.length > 0) count++;
    if (this.filters.admissionTypes && this.filters.admissionTypes.length > 0) count++;
    if (this.filters.leadSources && this.filters.leadSources.length > 0) count++;
    if (this.filters.userIds && this.filters.userIds.length > 0) count++;
    if (this.filters.consultancyIds && this.filters.consultancyIds.length > 0) count++;
    if (this.filters.courseIds && this.filters.courseIds.length > 0) count++;
    if (this.filters.duplicateOnly !== null) count++;
    if (this.filters.includeDuplicate !== null) count++;
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

    console.log('Selected User IDs', this.filters.userIds);
    console.log('Selected Consultancy IDs', this.filters.consultancyIds);
    console.log('Selected Course IDs', this.filters.courseIds);

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
      this.filters.isDiscounted ?? undefined,
      this.filters.consultancyId ?? undefined,
      this.filters.userId ?? undefined,
      this.filters.showOnlyPaid ?? undefined,
      this.filters.showOnlyFoc ?? undefined,
      this.filters.showOnlySbs ?? undefined,
      this.filters.states,
      this.filters.cities,
      this.filters.courseTypes,
      this.filters.sessions,
      this.filters.admissionTypes,
      this.filters.leadSources,
      this.filters.userIds,
      this.filters.consultancyIds,
      this.filters.courseIds,
      this.filters.duplicateOnly ?? undefined,
      this.filters.excludeDuplicate ?? undefined,
      this.filters.includeDuplicate ?? undefined
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
      leadSourceId: null,
      consultancyId: null,
      userId: null,
      duplicateOnly: null,
      excludeDuplicate: true,
      includeDuplicate: null
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
        leadSourceId: savedState.filters.leadSourceId || null,
        consultancyId: savedState.filters.consultancyId || null,
        userId: savedState.filters.userId || null,
        duplicateOnly: savedState.filters.duplicateOnly !== null ? savedState.filters.duplicateOnly.toString() : null,
        excludeDuplicate: savedState.filters.excludeDuplicate !== null ? savedState.filters.excludeDuplicate.toString() : null,
        includeDuplicate: savedState.filters.includeDuplicate !== null ? savedState.filters.includeDuplicate.toString() : null
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
    if (filter === 'DUPLICATE') {
      const isCurrentlyOnly = this.filters.duplicateOnly === true;
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          statFilter: isCurrentlyOnly ? null : 'DUPLICATE',
          duplicateOnly: isCurrentlyOnly ? null : 'true',
          excludeDuplicate: isCurrentlyOnly ? 'true' : 'false',
          includeDuplicate: null
        },
        queryParamsHandling: 'merge'
      });
      return;
    }
    const newFilter = this.filters.statFilter === filter ? '' : filter;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { statFilter: newFilter || null },
      queryParamsHandling: 'merge'
    });
  }

  toggleLeadSourceFilter(sourceId: string | null): void {
    const targetId = sourceId || '00000000-0000-0000-0000-000000000000';
    const currentId = this.filters.leadSourceId || '';
    const newId = currentId === targetId ? '' : targetId;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { leadSourceId: newId || null, page: 1 },
      queryParamsHandling: 'merge'
    });
  }

  applyFilters(): void {
    this.showFilterDrawer = false;
    console.log('[ApplyFilters] userIds:', this.filters.userIds);
    console.log('[ApplyFilters] consultancyIds:', this.filters.consultancyIds);
    console.log('[ApplyFilters] courseIds:', this.filters.courseIds);
    const queryParams: any = {
      page: 1,
      courseId: this.filters.courseId || null,
      session: this.filters.session || null,
      commissionStatus: this.filters.commissionStatus || null,
      fiftyPercentFeesPaid: this.filters.fiftyPercentFeesPaid !== null ? this.filters.fiftyPercentFeesPaid.toString() : null,
      startDate: this.filters.startDate || null,
      endDate: this.filters.endDate || null,
      state: this.filters.state || null,
      city: this.filters.city || null,
      states: (this.filters.states && this.filters.states.length > 0) ? this.filters.states.join(',') : null,
      cities: (this.filters.cities && this.filters.cities.length > 0) ? this.filters.cities.join(',') : null,
      courseTypes: (this.filters.courseTypes && this.filters.courseTypes.length > 0) ? this.filters.courseTypes.join(',') : null,
      source: this.filters.source || null,
      isScholar: this.filters.isScholar || null,
      leadSourceId: this.filters.leadSourceId || null,
      isDiscounted: this.filters.isDiscounted !== null ? this.filters.isDiscounted.toString() : null,
      consultancyId: this.filters.consultancyId || null,
      userId: this.filters.userId || null,
      showOnlyPaid: this.filters.showOnlyPaid !== null ? this.filters.showOnlyPaid.toString() : null,
      showOnlyFoc: this.filters.showOnlyFoc !== null ? this.filters.showOnlyFoc.toString() : null,
      showOnlySbs: this.filters.showOnlySbs !== null ? this.filters.showOnlySbs.toString() : null,
      appDateRangeType: this.filters.appDateRangeType || null,
      admDateRangeType: this.filters.admDateRangeType || null,
      appStartDate: this.filters.appStartDate || null,
      appEndDate: this.filters.appEndDate || null,
      admStartDate: this.filters.admStartDate || null,
      admEndDate: this.filters.admEndDate || null,
      sessions: (this.filters.sessions && this.filters.sessions.length > 0) ? this.filters.sessions.join(',') : null,
      admissionTypes: (this.filters.admissionTypes && this.filters.admissionTypes.length > 0) ? this.filters.admissionTypes.join(',') : null,
      leadSources: (this.filters.leadSources && this.filters.leadSources.length > 0) ? this.filters.leadSources.join(',') : null,
      userIds: (this.filters.userIds && this.filters.userIds.length > 0) ? this.filters.userIds.join(',') : null,
      consultancyIds: (this.filters.consultancyIds && this.filters.consultancyIds.length > 0) ? this.filters.consultancyIds.join(',') : null,
      courseIds: (this.filters.courseIds && this.filters.courseIds.length > 0) ? this.filters.courseIds.join(',') : null,
      duplicateOnly: this.filters.duplicateOnly !== null ? this.filters.duplicateOnly.toString() : null,
      excludeDuplicate: this.filters.excludeDuplicate !== null ? this.filters.excludeDuplicate.toString() : null,
      includeDuplicate: this.filters.includeDuplicate !== null ? this.filters.includeDuplicate.toString() : null
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
      states: [],
      cities: [],
      courseTypes: [],
      courseId: null,
      session: '',
      commissionStatus: '',
      fiftyPercentFeesPaid: null,
      startDate: '',
      endDate: '',
      leadSourceId: '',
      isDiscounted: null,
      consultancyId: null,
      userId: null,
      showOnlyPaid: null,
      showOnlyFoc: null,
      showOnlySbs: null,
      appDateRangeType: '',
      admDateRangeType: '',
      appStartDate: '',
      appEndDate: '',
      admStartDate: '',
      admEndDate: '',
      sessions: [],
      admissionTypes: [],
      leadSources: [],
      userIds: [],
      consultancyIds: [],
      courseIds: [],
      duplicateOnly: null,
      excludeDuplicate: true,
      includeDuplicate: null
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
        if (this.filters.states && this.filters.states.length > 0) {
          this.loadCitiesForSelectedStates();
        } else if (this.filters.state) {
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

  loadCitiesForSelectedStates(): void {
    if (!this.filters.states || this.filters.states.length === 0) {
      this.cities = [];
      this.filters.cities = [];
      return;
    }
    this.loadingCities = true;
    const obs = this.filters.states.map(state => this.locationService.getCitiesByState(state));
    forkJoin(obs).subscribe({
      next: (results: string[][]) => {
        const allCities = results.reduce((acc, val) => acc.concat(val), []);
        this.cities = Array.from(new Set(allCities)).sort();
        // Remove any selected cities that are no longer valid for the selected states
        this.filters.cities = this.filters.cities.filter(c => this.cities.includes(c));
        this.loadingCities = false;
      },
      error: err => {
        console.error('Error loading cities for selected states', err);
        this.loadingCities = false;
      }
    });
  }

  loadActiveCourseTypes(): void {
    this.courseTypeService.getActiveCourseTypes().subscribe({
      next: (res: any[]) => {
        this.courseTypes = res || [];
      },
      error: err => console.error('Error loading active course types', err)
    });
  }

  toggleStateSelection(state: string): void {
    if (!this.filters.states) {
      this.filters.states = [];
    }
    const index = this.filters.states.indexOf(state);
    if (index === -1) {
      this.filters.states.push(state);
    } else {
      this.filters.states.splice(index, 1);
    }
    this.loadCitiesForSelectedStates();
  }

  toggleCitySelection(city: string): void {
    if (!this.filters.cities) {
      this.filters.cities = [];
    }
    const index = this.filters.cities.indexOf(city);
    if (index === -1) {
      this.filters.cities.push(city);
    } else {
      this.filters.cities.splice(index, 1);
    }
  }

  toggleCourseTypeSelection(ct: string): void {
    if (!this.filters.courseTypes) {
      this.filters.courseTypes = [];
    }
    const index = this.filters.courseTypes.indexOf(ct);
    if (index === -1) {
      this.filters.courseTypes.push(ct);
    } else {
      this.filters.courseTypes.splice(index, 1);
    }
  }

  toggleSessionSelection(session: string): void {
    if (!this.filters.sessions) this.filters.sessions = [];
    const index = this.filters.sessions.indexOf(session);
    if (index === -1) {
      this.filters.sessions.push(session);
    } else {
      this.filters.sessions.splice(index, 1);
    }
  }

  get filteredSessions(): string[] {
    const term = (this.searchTerms.session || '').toLowerCase().trim();
    if (!term) return this.sessions;
    return this.sessions.filter(s => s.toLowerCase().includes(term));
  }

  toggleAdmissionTypeSelection(val: string): void {
    if (!this.filters.admissionTypes) this.filters.admissionTypes = [];
    const index = this.filters.admissionTypes.indexOf(val);
    if (index === -1) {
      this.filters.admissionTypes.push(val);
    } else {
      this.filters.admissionTypes.splice(index, 1);
    }
  }

  get filteredAdmissionTypes(): { value: string, name: string }[] {
    const term = (this.searchTerms.admissionType || '').toLowerCase().trim();
    if (!term) return this.admissionTypesList;
    return this.admissionTypesList.filter(t => t.name.toLowerCase().includes(term));
  }

  toggleLeadSourceSelection(id: string): void {
    if (!this.filters.leadSources) this.filters.leadSources = [];
    const index = this.filters.leadSources.indexOf(id);
    if (index === -1) {
      this.filters.leadSources.push(id);
    } else {
      this.filters.leadSources.splice(index, 1);
    }
  }

  get filteredLeadSources(): any[] {
    const term = (this.searchTerms.leadSource || '').toLowerCase().trim();
    const list = this.activeLeadSources || [];
    if (!term) return list;
    return list.filter(s => s.name && s.name.toLowerCase().includes(term));
  }

  toggleUserSelection(id: number): void {
    if (!this.filters.userIds) this.filters.userIds = [];
    const numId = Number(id);
    const index = this.filters.userIds.findIndex(x => Number(x) === numId);
    if (index === -1) {
      this.filters.userIds.push(numId);
    } else {
      this.filters.userIds.splice(index, 1);
    }
  }

  toggleConsultancySelection(id: number): void {
    if (!this.filters.consultancyIds) this.filters.consultancyIds = [];
    const numId = Number(id);
    const index = this.filters.consultancyIds.findIndex(x => Number(x) === numId);
    if (index === -1) {
      this.filters.consultancyIds.push(numId);
    } else {
      this.filters.consultancyIds.splice(index, 1);
    }
  }

  toggleCourseSelection(id: number): void {
    if (!this.filters.courseIds) this.filters.courseIds = [];
    const numId = Number(id);
    const index = this.filters.courseIds.findIndex(x => Number(x) === numId);
    if (index === -1) {
      this.filters.courseIds.push(numId);
    } else {
      this.filters.courseIds.splice(index, 1);
    }
  }

  getUserNameById(id: number): string {
    const cached = this.modalSelectionCache.get(id);
    if (cached) return cached.fullName || cached.name;
    const u = this.users.find(x => (x.id || x.userId) == id);
    return u ? (u.fullName || u.name) : `User ID: ${id}`;
  }

  getConsultancyNameById(id: number): string {
    const cached = this.modalSelectionCache.get(id);
    if (cached) return cached.name;
    const c = this.consultancies.find(x => x.id == id);
    return c ? c.name : `Consultancy ID: ${id}`;
  }

  getCourseNameById(id: number): string {
    const cached = this.modalSelectionCache.get(id);
    if (cached) return cached.name;
    const c = this.courses.find(x => x.id == id);
    return c ? c.name : `Course ID: ${id}`;
  }

  getLeadSourceNameById(id: string): string {
    if (id === '00000000-0000-0000-0000-000000000000' || id === 'Unmapped') return 'Unmapped';
    const ls = this.activeLeadSources.find(x => x.id === id);
    return ls ? ls.name : id;
  }

  get filteredStates(): string[] {
    const term = (this.searchTerms.state || '').toLowerCase().trim();
    if (!term) return this.states;
    return this.states.filter(s => s.toLowerCase().includes(term));
  }

  get filteredCities(): string[] {
    const term = (this.searchTerms.city || '').toLowerCase().trim();
    if (!term) return this.cities;
    return this.cities.filter(c => c.toLowerCase().includes(term));
  }

  get filteredCourseTypes(): any[] {
    const term = (this.searchTerms.courseType || '').toLowerCase().trim();
    if (!term) return this.courseTypes;
    return this.courseTypes.filter(ct => ct.name && ct.name.toLowerCase().includes(term));
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.dropdowns.state = false;
    this.dropdowns.city = false;
    this.dropdowns.courseType = false;
    this.dropdowns.session = false;
    this.dropdowns.admissionType = false;
    this.dropdowns.leadSource = false;
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
    if (['states', 'cities', 'courseTypes', 'sessions', 'admissionTypes', 'leadSources', 'userIds', 'consultancyIds', 'courseIds'].includes(key)) {
      (this.filters as any)[key] = [];
      if (key === 'states') {
        this.filters.cities = [];
        this.cities = [];
      }
    } else {
      (this.filters as any)[key] = '';
    }
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
    return !!(
      this.searchTerm ||
      this.filters.source ||
      this.filters.isScholar ||
      this.filters.statusFilter ||
      this.filters.courseId ||
      this.filters.session ||
      this.filters.state ||
      this.filters.city ||
      this.filters.startDate ||
      (this.filters.sessions && this.filters.sessions.length > 0) ||
      (this.filters.admissionTypes && this.filters.admissionTypes.length > 0) ||
      (this.filters.leadSources && this.filters.leadSources.length > 0) ||
      (this.filters.userIds && this.filters.userIds.length > 0) ||
      (this.filters.consultancyIds && this.filters.consultancyIds.length > 0) ||
      (this.filters.courseIds && this.filters.courseIds.length > 0) ||
      (this.filters.states && this.filters.states.length > 0) ||
      (this.filters.cities && this.filters.cities.length > 0) ||
      (this.filters.courseTypes && this.filters.courseTypes.length > 0)
    );
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

  // ── Report Status ─────────────────────────────────────────────────────
  onToggleReportStatus(item: AdmissionItem) {
    const isReported = item.reportStatus === 'REPORTED';
    const targetStatus = isReported ? 'NOT_REPORTED' : 'REPORTED';

    if (targetStatus === 'NOT_REPORTED' && !this.authService.isAdmin()) {
      return; // Reverting is blocked for non-admin
    }

    this.selectedAdmissionForReport = item;
    this.targetReportStatus = targetStatus;

    if (targetStatus === 'REPORTED') {
      this.reportModalMessage = `Are you sure you want to mark '${item.fullName}' as REPORTED? Once reported, duplicate counselor credits are prevented and non-admin users cannot revert this status.`;
    } else {
      this.reportModalMessage = `Are you sure you want to revert '${item.fullName}' to NOT_REPORTED?`;
    }

    this.showReportModal = true;
  }

  confirmReportStatus() {
    if (!this.selectedAdmissionForReport || !this.selectedAdmissionForReport.id) return;

    const id = this.selectedAdmissionForReport.id;
    const status = this.targetReportStatus;
    this.loading = true;

    this.admissionService.updateReportStatus(id, status).subscribe({
      next: () => {
        this.showReportModal = false;
        this.selectedAdmissionForReport = null;
        this.targetReportStatus = '';
        this.fetchData();
      },
      error: (err) => {
        this.showReportModal = false;
        this.selectedAdmissionForReport = null;
        this.targetReportStatus = '';
        this.loading = false;
        alert(err.error?.message || 'Failed to update report status');
      }
    });
  }

  cancelReportStatus() {
    this.showReportModal = false;
    this.selectedAdmissionForReport = null;
    this.targetReportStatus = '';
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
    const finalEndDate = this.isApplicationTab ? this.filters.appEndDate : this.filters.admEndDate;

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
      finalEndDate || this.filters.endDate,
      this.filters.leadSourceId,
      this.searchTerm,
      this.filters.isDiscounted ?? undefined,
      this.filters.consultancyId ?? undefined,
      this.filters.userId ?? undefined,
      this.filters.states,
      this.filters.cities,
      this.filters.courseTypes,
      this.filters.sessions,
      this.filters.admissionTypes,
      this.filters.leadSources,
      this.filters.userIds,
      this.filters.consultancyIds,
      this.filters.courseIds,
      this.filters.duplicateOnly ?? undefined,
      this.filters.excludeDuplicate ?? undefined,
      this.filters.includeDuplicate ?? undefined
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
    if (this.filters.courseId) {
      const course = this.courses.find(c => c.id === this.filters.courseId);
      parts.push(`Course: ${course ? course.name : this.filters.courseId}`);
    }
    if (this.filters.consultancyId) {
      const con = this.consultancies.find(c => c.id === this.filters.consultancyId);
      parts.push(`Consultancy: ${con ? con.name : this.filters.consultancyId}`);
    }
    if (this.filters.userId) {
      const user = this.users.find(u => u.id === this.filters.userId);
      parts.push(`Counselor: ${user ? (user.fullName || user.name) : this.filters.userId}`);
    }
    return parts;
  }

  openUserFilter() {
    this.activeModal = 'user';
    this.modalCurrentPage = 1;
    this.modalSearchText = '';
    this.loadModalData();
  }

  openConsultancyFilter() {
    this.activeModal = 'consultancy';
    this.modalCurrentPage = 1;
    this.modalSearchText = '';
    this.loadModalData();
  }

  openCourseFilter() {
    this.activeModal = 'course';
    this.modalCurrentPage = 1;
    this.modalSearchText = '';
    this.loadModalData();
  }

  loadModalData() {
    this.modalLoading = true;
    this.modalItems = [];
    if (this.activeModal === 'user') {
      this.userService.getUsersPaged(
        this.modalCurrentPage - 1, // converting 1-based page to 0-based for service
        this.modalPageSize,
        this.modalSearchText,
        '',
        'ACTIVE'
      ).subscribe({
        next: (res: any) => {
          this.modalItems = res.content || [];
          this.modalTotalElements = res.totalElements || 0;
          this.modalTotalPages = res.totalPages || 0;
          this.modalLoading = false;
        },
        error: (err) => {
          console.error('Error loading user modal data', err);
          this.modalLoading = false;
        }
      });
    } else if (this.activeModal === 'consultancy') {
      this.consultancyService.getConsultancyPage({
        page: this.modalCurrentPage - 1, // converting 1-based page to 0-based for service
        size: this.modalPageSize,
        search: this.modalSearchText || undefined,
        status: 'ACTIVE'
      }).subscribe({
        next: (res: any) => {
          this.modalItems = res.content || [];
          this.modalTotalElements = res.totalElements || 0;
          this.modalTotalPages = res.totalPages || 0;
          this.modalLoading = false;
        },
        error: (err) => {
          console.error('Error loading consultancy modal data', err);
          this.modalLoading = false;
        }
      });
    } else if (this.activeModal === 'course') {
      this.courseService.getCoursesPaged(
        this.modalCurrentPage - 1, // converting 1-based page to 0-based for service
        this.modalPageSize,
        this.modalSearchText,
        true
      ).subscribe({
        next: (res: any) => {
          this.modalItems = res.content || [];
          this.modalTotalElements = res.totalElements || 0;
          this.modalTotalPages = res.totalPages || 0;
          this.modalLoading = false;
        },
        error: (err) => {
          console.error('Error loading course modal data', err);
          this.modalLoading = false;
        }
      });
    }
  }

  onModalSearch(term: string) {
    this.modalSearchText = term;
    this.modalCurrentPage = 1;
    this.loadModalData();
  }

  onModalPageChange(page: number) {
    this.modalCurrentPage = page;
    this.loadModalData();
  }

  onModalSelect(items: any[]) {
    if (!items) {
      this.activeModal = null;
      return;
    }
    items.forEach(item => this.cacheSelectedItem(item));
    // Safely extract numeric IDs — handles both object and primitive inputs
    const ids: number[] = items.map(item => {
      const raw = typeof item === 'object' && item !== null ? this.getItemId(item) : item;
      return Number(raw);
    }).filter(id => !isNaN(id) && id > 0);

    if (this.activeModal === 'user') {
      this.filters.userIds = ids;
      console.log('[Filter] userIds set to:', ids);
    } else if (this.activeModal === 'consultancy') {
      this.filters.consultancyIds = ids;
      console.log('[Filter] consultancyIds set to:', ids);
    } else if (this.activeModal === 'course') {
      this.filters.courseIds = ids;
      console.log('[Filter] courseIds set to:', ids);
    }
    this.activeModal = null;
    this.updateActiveFilterCount();
  }

  onModalClose() {
    this.activeModal = null;
  }

  getSelectedUserName(): string {
    if (!this.filters.userId) return '';
    const u = this.users.find(x => (x.id || x.userId) === this.filters.userId);
    return u ? (u.fullName || u.name) : `User ID: ${this.filters.userId}`;
  }

  getSelectedConsultancyName(): string {
    if (!this.filters.consultancyId) return '';
    const c = this.consultancies.find(x => x.id === this.filters.consultancyId);
    return c ? c.name : `Consultancy ID: ${this.filters.consultancyId}`;
  }

  getSelectedCourseName(): string {
    if (!this.filters.courseId) return '';
    const c = this.courses.find(x => x.id === this.filters.courseId);
    return c ? c.name : `Course ID: ${this.filters.courseId}`;
  }

  getSelectedLeadSourceName(): string {
    if (!this.filters.leadSourceId) return '';
    if (this.filters.leadSourceId === '00000000-0000-0000-0000-000000000000') return 'Unmapped';
    const ls = this.activeLeadSources.find(x => x.id === this.filters.leadSourceId);
    return ls ? ls.name : `Source ID: ${this.filters.leadSourceId}`;
  }

  getDuplicateFilterValue(): string {
    if (this.filters.duplicateOnly) {
      return 'only';
    }
    if (this.filters.includeDuplicate) {
      return 'all';
    }
    return 'exclude';
  }

  setDuplicateFilterValue(value: string): void {
    if (value === 'only') {
      this.filters.duplicateOnly = true;
      this.filters.excludeDuplicate = null;
      this.filters.includeDuplicate = null;
    } else if (value === 'all') {
      this.filters.duplicateOnly = null;
      this.filters.excludeDuplicate = null;
      this.filters.includeDuplicate = true;
    } else {
      // Default / 'exclude'
      this.filters.duplicateOnly = null;
      this.filters.excludeDuplicate = true;
      this.filters.includeDuplicate = null;
    }
  }

  canEditDuplicate(): boolean {
    return !this.authService.hasRole('ROLE_READ_ONLY') && !this.authService.hasRole('ROLE_VIEWER');
  }

  onDuplicateToggleClick(item: AdmissionItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.selectedStudentForDuplicateToggle = item;

    if (!item.isDuplicateForm) {
      this.duplicateConfirmMode = 'mark';
      this.duplicateConfirmTitle = 'Mark as Duplicate Application';
      this.duplicateConfirmMessage = 'You are about to mark this application as a duplicate. Duplicate applications continue to behave as normal applications. This action only helps identify duplicate submissions. You can reverse this action later.';
      this.duplicateConfirmConfirmText = 'Mark as Duplicate';
      this.duplicateRemarksInput = '';
    } else {
      this.duplicateConfirmMode = 'unmark';
      this.duplicateConfirmTitle = 'Remove Duplicate Flag?';
      this.duplicateConfirmMessage = 'This application will no longer be marked as duplicate. This action does not affect admissions, fees or reports.';
      this.duplicateConfirmConfirmText = 'Remove';
    }

    this.showDuplicateConfirmModal = true;
  }

  cancelDuplicateToggle(): void {
    this.showDuplicateConfirmModal = false;
    this.selectedStudentForDuplicateToggle = null;
  }

  confirmDuplicateToggle(): void {
    if (!this.selectedStudentForDuplicateToggle) return;

    const item = this.selectedStudentForDuplicateToggle;
    const isDuplicate = this.duplicateConfirmMode === 'mark';
    const remarks = isDuplicate ? this.duplicateRemarksInput : null;

    this.showDuplicateConfirmModal = false;
    this.selectedStudentForDuplicateToggle = null;

    this.admissionService.updateAdmission(
      item.id!,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      isDuplicate,
      remarks || undefined,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any
    ).subscribe({
      next: () => {
        item.isDuplicateForm = isDuplicate;
        item.duplicateRemarks = remarks || '';
        this.notificationService.success('Success', `Successfully updated duplicate status.`);
      },
      error: (err) => {
        console.error('Failed to update duplicate status', err);
        this.notificationService.error('Error', err.error?.message || 'Failed to update Duplicate status.');
      }
    });
  }
}