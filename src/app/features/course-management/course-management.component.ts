import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { CourseService } from '../../core/services/course.service';
import { CourseItem, CoursePageData } from '../../core/models/course.model';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';
import { AddCourseModalComponent } from './components/add-course-modal/add-course-modal.component';
import { BulkUploadModalComponent } from '../../shared/components/bulk-upload-modal/bulk-upload-modal.component';
import { StatePreservationService } from '../../core/services/state-preservation.service';

@Component({
  selector: 'app-course-management',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    SidebarComponent, TopbarComponent,
    ConfirmationModalComponent, AddCourseModalComponent, BulkUploadModalComponent
  ],
  templateUrl: './course-management.component.html',
  styleUrls: ['./course-management.component.scss']
})
export class CourseManagementComponent implements OnInit, OnDestroy {
  pageData: CoursePageData | null = null;
  loading = true;
  searchTerm = '';
  Math = Math;

  currentPage = 1;
  pageSize = 10;
  sortBy = 'name';
  sortDirection = 'asc';
  activeFilter: boolean | null = null;
  totalElements = 0;

  feeFilter = 'ALL_TIME';
  startDate = '';
  endDate = '';
  sessionFilter = '';
  availableSessions: string[] = [];

  // Actions
  showDeleteModal = false;
  selectedCourse: CourseItem | null = null;
  showAddModal = false;
  showBulkUploadModal = false;
  editCourseId: number | null = null;

  // ── RxJS teardown + search debounce ─────────────────────────────────────────
  private readonly destroy$ = new Subject<void>();
  // searchSubject is set up ONCE here; never re-subscribed
  private readonly searchSubject = new Subject<string>();

  constructor(
    public courseService: CourseService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private statePreservationService: StatePreservationService
  ) {
    this.generateSessions();
  }

  ngOnInit(): void {
    // ── 1. Restore persisted state ───────────────────────────────────────────
    const savedState = this.statePreservationService.getState<any>('cms_course_management_state');
    if (savedState) {
      this.currentPage   = savedState.currentPage   || 1;
      this.pageSize      = savedState.pageSize       || 10;
      this.sortBy        = savedState.sortBy         || 'name';
      this.sortDirection = savedState.sortDirection  || 'asc';
      this.searchTerm    = savedState.searchTerm     || '';
      this.activeFilter  = savedState.activeFilter   !== undefined ? savedState.activeFilter : null;
      this.feeFilter     = savedState.feeFilter      || 'ALL_TIME';
      this.startDate     = savedState.startDate      || '';
      this.endDate       = savedState.endDate        || '';
      this.sessionFilter = savedState.sessionFilter  || '';
    }

    // ── 2. Handle query params ONCE (take(1) or takeUntil) ───────────────────
    // Using takeUntil so it cleans up on destroy; the subscription only
    // fires when queryParams actually change (Angular emits once on load).
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const active = params['active'];
        if (active !== undefined) {
          this.activeFilter = active === 'true';
        }

        // Handle route-triggered edit
        const editId = params['id'];
        if (editId && this.route.snapshot.fragment === 'edit') {
          this.onEdit(+editId);
        }
      });

    // ── 3. Wire search debounce ONCE — never re-subscribe ────────────────────
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadData();
    });

    // ── 4. Initial data load ──────────────────────────────────────────────────
    this.loadData();
  }

  // ── Actions ──────────────────────────────────────────────────────────────────

  generateSessions(): void {
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
      this.availableSessions.push((currentYear - i).toString());
    }
  }

  onView(id: number): void {
    this.router.navigate(['/courses', id]);
  }

  onEdit(id: number): void {
    this.editCourseId = id;
    this.showAddModal = true;
  }

  openAddModal(): void {
    this.editCourseId = null;
    this.showAddModal = true;
  }

  closeAddModal(): void {
    const hasRouteTrigger = this.route.snapshot.fragment === 'edit' || !!this.route.snapshot.queryParams['id'];
    this.showAddModal = false;
    this.editCourseId = null;
    if (hasRouteTrigger) {
      this.location.back();
    }
  }

  onAddSuccess(): void {
    this.closeAddModal();
    this.loadData();
  }

  onBulkUploadSuccess(_result: any): void {
    this.loadData();
  }

  onDelete(course: CourseItem): void {
    this.selectedCourse = course;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.selectedCourse = null;
    this.showDeleteModal = false;
  }

  confirmDelete(): void {
    if (!this.selectedCourse) return;
    this.loading = true;
    this.courseService.deleteCourse(this.selectedCourse.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.selectedCourse = null;
          this.showDeleteModal = false;
          this.loadData();
        },
        error: (err: any) => {
          console.error('Error deleting course', err);
          this.loading = false;
          this.showDeleteModal = false;
        }
      });
  }

  // ── Data loading ──────────────────────────────────────────────────────────────

  loadData(): void {
    this.loading = true;

    this.statePreservationService.saveState('cms_course_management_state', {
      currentPage:   this.currentPage,
      pageSize:      this.pageSize,
      sortBy:        this.sortBy,
      sortDirection: this.sortDirection,
      searchTerm:    this.searchTerm,
      activeFilter:  this.activeFilter,
      feeFilter:     this.feeFilter,
      startDate:     this.startDate,
      endDate:       this.endDate,
      sessionFilter: this.sessionFilter
    });

    this.courseService.getCoursesPaged(
      this.currentPage - 1,
      this.pageSize,
      this.searchTerm,
      this.activeFilter,
      this.sortBy,
      this.sortDirection
    )
    // takeUntil cleans up if component is destroyed mid-flight;
    // switchMap is NOT used here because loadData() is already called
    // imperatively (one call = one response), preventing duplication.
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res) => {
        this.pageData = {
          stats: res.stats,
          courses: res.content,
          totalCount: res.totalElements
        };
        this.totalElements = res.totalElements;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading courses paged', err);
        this.loading = false;
      }
    });
  }

  // ── Search ────────────────────────────────────────────────────────────────────

  /** Called by (ngModelChange) on the search input. Emits to the debounced subject. */
  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  // ── Filters ───────────────────────────────────────────────────────────────────

  onFeeFilterChange(): void {
    this.currentPage = 1;
    this.loadData();
  }

  setFilter(filter: boolean | null): void {
    this.activeFilter = filter;
    this.currentPage = 1;
    this.loadData();
  }

  // ── Sorting ───────────────────────────────────────────────────────────────────

  toggleSort(column: string): void {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.loadData();
  }

  // ── Pagination ────────────────────────────────────────────────────────────────

  get totalPages(): number {
    return Math.ceil(this.totalElements / this.pageSize) || 1;
  }

  get paginatedCourses(): CourseItem[] {
    return this.pageData?.courses || [];
  }

  getPagesArray(): (number | string)[] {
    const total   = this.totalPages;
    const current = this.currentPage;
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      const start = Math.max(2, current - 1);
      const end   = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }

    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadData();
    }
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadData();
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────────

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
