import { Component, EventEmitter, Input, OnInit, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';
import { AdmissionService } from '../../../core/services/admission.service';
import { LeadSourceService } from '../../../core/services/lead-source.service';
import { CourseService } from '../../../core/services/course.service';

@Component({
  selector: 'app-student-analytics-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-analytics-modal.component.html',
  styleUrls: ['./student-analytics-modal.component.scss']
})
export class StudentAnalyticsModalComponent implements OnInit, OnDestroy {
  protected readonly Math = Math;

  @Input() courseId!: number;
  @Input() userId!: number;
  @Input() counselorName!: string;
  @Input() courseName!: string;
  @Input() initialTab: string = 'ALL_APPLICATIONS';
  @Input() city: string = '';
  @Input() state: string = '';
  // Breakdown-specific ID inputs (only one will be non-zero/non-null at a time)
  @Input() consultancyId?: number;
  @Input() institutionId?: number;
  @Input() inputLeadSourceId?: string;

  @Output() close = new EventEmitter<void>();

  activeTab: string = 'ALL_APPLICATIONS';
  searchQuery: string = '';
  session: string = '';
  startDate: string = '';
  endDate: string = '';
  feesStatus: string = 'ALL';
  leadSourceId: string = '';
  reportedStatus: string = 'ALL';
  sourceType: string = ''; // 'USER' | 'CONSULTANCY' | ''
  
  // Filter Drawer toggle
  showFilterDrawer: boolean = false;

  // Dropdown lists
  leadSources: any[] = [];

  // Paged Admissions list
  admissions: any[] = [];
  totalCount: number = 0;
  page: number = 1;
  size: number = 10;
  loading: boolean = false;
  sortColumn: string = 'createdAt';
  sortDirection: string = 'desc';

  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;

  // Export state
  exporting: boolean = false;
  exportError: string = '';
  exportSuccess: boolean = false;
  private exportSuccessTimer: any;

  tabs = [
    { id: 'ALL_APPLICATIONS', label: 'Total Applications' },
    { id: 'TOTAL_ADMISSIONS', label: 'Admissions' },
    { id: 'CANCELLED_APP', label: 'Cancelled Applications' },
    { id: 'CANCELLED_ADM', label: 'Cancelled Admissions' },
    { id: 'REMAINING_APP', label: 'Remaining Applications' }
  ];

  constructor(
    private admissionService: AdmissionService,
    private leadSourceService: LeadSourceService,
    private courseService: CourseService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Lock background scroll
    document.body.classList.add('modal-open');

    // Read initial states from query parameters if present, otherwise use defaults
    const queryParams = this.route.snapshot.queryParams;
    
    if (queryParams['modalTab']) {
      this.activeTab = queryParams['modalTab'];
    } else if (this.initialTab) {
      this.activeTab = this.initialTab;
    }
    
    if (queryParams['modalSearch']) this.searchQuery = queryParams['modalSearch'];
    if (queryParams['modalSession']) this.session = queryParams['modalSession'];
    if (queryParams['modalStartDate']) this.startDate = queryParams['modalStartDate'];
    if (queryParams['modalEndDate']) this.endDate = queryParams['modalEndDate'];
    if (queryParams['modalFeesStatus']) this.feesStatus = queryParams['modalFeesStatus'];
    if (queryParams['modalLeadSourceId']) this.leadSourceId = queryParams['modalLeadSourceId'];
    if (queryParams['modalReportedStatus']) this.reportedStatus = queryParams['modalReportedStatus'];
    if (queryParams['modalSourceType']) this.sourceType = queryParams['modalSourceType'];
    
    if (queryParams['modalPage']) this.page = Number(queryParams['modalPage']);
    if (queryParams['modalSize']) this.size = Number(queryParams['modalSize']);
    if (queryParams['modalSortColumn']) this.sortColumn = queryParams['modalSortColumn'];
    if (queryParams['modalSortDirection']) this.sortDirection = queryParams['modalSortDirection'];
    if (queryParams['modalShowFilterDrawer'] === 'true') this.showFilterDrawer = true;

    // Load filter listings
    this.loadFilterDropdowns();
    
    // Setup debounced search subscription
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.page = 1;
      this.updateQueryParams();
      this.loadData();
    });

    this.loadData();
  }

  ngOnDestroy(): void {
    // Unlock background scroll
    document.body.classList.remove('modal-open');
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  loadFilterDropdowns(): void {
    // Lead Sources
    this.leadSourceService.getActive().subscribe({
      next: (res) => {
        this.leadSources = res.data || [];
      },
      error: (err) => console.error('Failed to load lead sources', err)
    });
  }

  updateQueryParams(): void {
    const qp: any = {
      showAnalyticsModal: 'true',
      modalUserId: this.userId,
      modalUserName: this.counselorName,
      modalInitialTab: this.initialTab,
      
      modalTab: this.activeTab,
      modalSearch: this.searchQuery || null,
      modalSession: this.session || null,
      modalStartDate: this.startDate || null,
      modalEndDate: this.endDate || null,
      modalFeesStatus: this.feesStatus !== 'ALL' ? this.feesStatus : null,
      modalLeadSourceId: this.leadSourceId || null,
      modalReportedStatus: this.reportedStatus !== 'ALL' ? this.reportedStatus : null,
      modalSourceType: this.sourceType || null,
      modalPage: this.page > 1 ? this.page : null,
      modalSize: this.size !== 10 ? this.size : null,
      modalSortColumn: this.sortColumn !== 'createdAt' ? this.sortColumn : null,
      modalSortDirection: this.sortDirection !== 'desc' ? this.sortDirection : null,
      modalShowFilterDrawer: this.showFilterDrawer ? 'true' : null
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: qp,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchQuery);
  }

  onTabChange(tabId: string): void {
    this.activeTab = tabId;
    this.page = 1;
    this.updateQueryParams();
    this.loadData();
  }

  onFilterChange(): void {
    this.page = 1;
    this.updateQueryParams();
    this.loadData();
  }

  toggleFilters(): void {
    this.showFilterDrawer = !this.showFilterDrawer;
    this.updateQueryParams();
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.session) count++;
    if (this.startDate) count++;
    if (this.endDate) count++;
    if (this.feesStatus !== 'ALL') count++;
    if (this.leadSourceId) count++;
    if (this.reportedStatus !== 'ALL') count++;
    if (this.sourceType) count++;
    return count;
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.session = '';
    this.startDate = '';
    this.endDate = '';
    this.feesStatus = 'ALL';
    this.leadSourceId = '';
    this.reportedStatus = 'ALL';
    this.sourceType = '';
    this.page = 1;

    this.updateQueryParams();
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    
    // Resolve fee filter parameter
    let fiftyPercentFeesPaid: boolean | undefined = undefined;
    if (this.feesStatus === 'PAID') {
      fiftyPercentFeesPaid = true;
    } else if (this.feesStatus === 'UNPAID') {
      fiftyPercentFeesPaid = false;
    }

    // Resolve reported status parameter
    let statusFilterParam: string | undefined = undefined;
    if (this.reportedStatus === 'REPORTED') {
      statusFilterParam = 'REPORTED';
    } else if (this.reportedStatus === 'NOT_REPORTED') {
      statusFilterParam = 'NOT_REPORTED';
    }

    console.log('[MODAL TABLE LOAD] Loading analytics data:', {
      activeTab: this.activeTab,
      page: this.page,
      size: this.size,
      search: this.searchQuery,
      courseId: this.courseId,
      userId: this.userId,
      feesStatus: this.feesStatus,
      fiftyPercentFeesPaid,
      reportedStatus: this.reportedStatus,
      statusFilterParam,
      sourceType: this.sourceType,
      session: this.session,
      startDate: this.startDate,
      endDate: this.endDate,
      leadSourceId: this.leadSourceId
    });

    this.admissionService.getAdmissionsData(
      this.page,
      this.size,
      this.searchQuery.trim() || undefined,
      this.activeTab,
      this.courseId ? Number(this.courseId) : undefined,
      this.sortColumn,
      this.sortDirection,
      undefined, // tab
      statusFilterParam,
      this.sourceType || undefined,
      undefined, // isScholar
      this.state || undefined, // state
      this.city || undefined, // city
      this.session || undefined,
      undefined, // commissionStatus
      fiftyPercentFeesPaid,
      this.startDate || undefined,
      this.endDate || undefined,
      this.leadSourceId || this.inputLeadSourceId || undefined, // filter dropdown OR breakdown input
      undefined, // appStartDate
      undefined, // appEndDate
      undefined, // admStartDate
      undefined, // admEndDate
      undefined, // isDiscounted
      this.consultancyId ? Number(this.consultancyId) : undefined, // consultancyId
      this.userId ? Number(this.userId) : undefined,               // userId
      undefined, // showOnlyPaid
      undefined, // showOnlyFoc
      undefined, // showOnlySbs
      undefined, // states
      undefined, // cities
      undefined, // courseTypes
      undefined, // sessions
      undefined, // admissionTypes
      undefined, // leadSources
      undefined, // userIds
      undefined, // consultancyIds
      undefined, // courseIds
      undefined, // duplicateOnly
      undefined, // excludeDuplicate
      undefined, // includeDuplicate
      this.institutionId ? Number(this.institutionId) : undefined  // institutionId
    ).subscribe({
      next: (res) => {
        this.admissions = res.admissions || [];
        this.totalCount = res.totalCount || 0;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load admissions analytics', err);
        this.admissions = [];
        this.totalCount = 0;
        this.loading = false;
      }
    });
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.updateQueryParams();
    this.loadData();
  }

  onSizeChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.size = Number(selectElement.value);
    this.page = 1;
    this.updateQueryParams();
    this.loadData();
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.page = 1;
    this.updateQueryParams();
    this.loadData();
  }

  onViewStudentDetail(id: number): void {
    // Unlock background scroll before navigating
    document.body.classList.remove('modal-open');
    this.router.navigate(['/admissions', id]);
  }

  exportToExcel(): void {
    if (this.exporting) return;
    this.exporting = true;
    this.exportError = '';
    this.exportSuccess = false;

    // Resolve fees status to boolean parameter
    let fiftyPercentFeesPaid: boolean | undefined = undefined;
    if (this.feesStatus === 'PAID') {
      fiftyPercentFeesPaid = true;
    } else if (this.feesStatus === 'UNPAID') {
      fiftyPercentFeesPaid = false;
    }

    // Debug: log active state snapshot at export time
    console.log('[EXPORT] Active state snapshot:', {
      activeTab: this.activeTab,
      courseId: this.courseId,
      userId: this.userId,
      search: this.searchQuery,
      session: this.session,
      feesStatus: this.feesStatus,
      fiftyPercentFeesPaid,
      reportedStatus: this.reportedStatus,
      sourceType: this.sourceType,
      leadSourceId: this.leadSourceId,
      startDate: this.startDate,
      endDate: this.endDate,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    });

    this.courseService.exportCourseUserBreakdownExcel(
      this.courseId,
      this.userId,
      this.activeTab,
      this.searchQuery.trim() || undefined,
      this.session || undefined,
      fiftyPercentFeesPaid,
      this.startDate || undefined,
      this.endDate || undefined,
      this.leadSourceId || undefined,
      this.reportedStatus !== 'ALL' ? this.reportedStatus : undefined,
      this.sourceType || undefined,
      this.sortColumn,
      this.sortDirection
    ).subscribe({
      next: (blob: Blob) => {
        const tabLabels: Record<string, string> = {
          ALL_APPLICATIONS: 'All_Applications',
          TOTAL_ADMISSIONS: 'Admissions',
          CANCELLED_APP: 'Cancelled_Applications',
          CANCELLED_ADM: 'Cancelled_Admissions',
          REMAINING_APP: 'Remaining_Applications'
        };
        const tabLabel = tabLabels[this.activeTab] || this.activeTab;
        const safeUserName = (this.counselorName || 'Counselor').replace(/\s+/g, '_');
        const timestamp = new Date().toISOString().slice(0, 10);
        const fileName = `${safeUserName}_${tabLabel}_${timestamp}.xlsx`;

        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(anchor);

        this.exporting = false;
        this.exportSuccess = true;
        // Auto-hide success badge after 4s
        if (this.exportSuccessTimer) clearTimeout(this.exportSuccessTimer);
        this.exportSuccessTimer = setTimeout(() => { this.exportSuccess = false; }, 4000);
      },
      error: (err: any) => {
        console.error('Excel export failed:', err);
        this.exporting = false;
        this.exportError = 'Export failed. Please try again.';
        if (this.exportSuccessTimer) clearTimeout(this.exportSuccessTimer);
        this.exportSuccessTimer = setTimeout(() => { this.exportError = ''; }, 4000);
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.size) || 1;
  }
}
