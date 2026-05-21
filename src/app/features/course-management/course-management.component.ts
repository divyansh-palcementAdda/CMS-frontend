import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { CourseService } from '../../core/services/course.service';
import { CourseItem, CoursePageData } from '../../core/models/course.model';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';
import { AddCourseModalComponent } from './components/add-course-modal/add-course-modal.component';
import { BulkUploadModalComponent } from '../../shared/components/bulk-upload-modal/bulk-upload-modal.component';
import { StatePreservationService } from '../../core/services/state-preservation.service';

@Component({
  selector: 'app-course-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, TopbarComponent, ConfirmationModalComponent, AddCourseModalComponent, BulkUploadModalComponent],
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
  
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  
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

  constructor(
    public courseService: CourseService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private statePreservationService: StatePreservationService
  ) {
    this.generateSessions();

    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.searchTerm = term;
      this.currentPage = 1;
      this.loadData();
    });
  }

  generateSessions() {
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
      this.availableSessions.push((currentYear - i).toString());
    }
  }

  onView(id: number) {
    this.router.navigate(['/courses', id]);
  }

  onEdit(id: number) {
    this.editCourseId = id;
    this.showAddModal = true;
  }

  openAddModal() {
    this.editCourseId = null;
    this.showAddModal = true;
  }

  closeAddModal() {
    const hasRouteTrigger = this.route.snapshot.fragment === 'edit' || !!this.route.snapshot.queryParams['id'];
    this.showAddModal = false;
    this.editCourseId = null;

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

  onDelete(course: CourseItem) {
    this.selectedCourse = course;
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.selectedCourse = null;
    this.showDeleteModal = false;
  }

  confirmDelete() {
    if (this.selectedCourse) {
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
  }

  ngOnInit() {
    const savedState = this.statePreservationService.getState<any>('cms_course_management_state');
    if (savedState) {
      this.currentPage = savedState.currentPage || 1;
      this.pageSize = savedState.pageSize || 10;
      this.sortBy = savedState.sortBy || 'name';
      this.sortDirection = savedState.sortDirection || 'asc';
      this.searchTerm = savedState.searchTerm || '';
      this.activeFilter = savedState.activeFilter !== undefined ? savedState.activeFilter : null;
      this.feeFilter = savedState.feeFilter || 'ALL_TIME';
      this.startDate = savedState.startDate || '';
      this.endDate = savedState.endDate || '';
      this.sessionFilter = savedState.sessionFilter || '';
    }

    this.route.queryParams.subscribe(params => {
      const active = params['active'];
      if (active !== undefined) {
        this.activeFilter = active === 'true';
      }
      this.loadData();

      // Handle route-triggered edit
      const editId = params['id'];
      if (editId && this.route.snapshot.fragment === 'edit') {
        this.onEdit(+editId);
      }
    });
  }

  loadData() {
    this.loading = true;

    // Save state
    this.statePreservationService.saveState('cms_course_management_state', {
      currentPage: this.currentPage,
      pageSize: this.pageSize,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection,
      searchTerm: this.searchTerm,
      activeFilter: this.activeFilter,
      feeFilter: this.feeFilter,
      startDate: this.startDate,
      endDate: this.endDate,
      sessionFilter: this.sessionFilter
    });

    this.courseService.getCoursesPaged(
      this.currentPage - 1,
      this.pageSize,
      this.searchTerm,
      this.activeFilter,
      this.sortBy,
      this.sortDirection
    ).pipe(takeUntil(this.destroy$))
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

  onFeeFilterChange() {
    this.currentPage = 1;
    this.loadData();
  }

  get paginatedCourses(): CourseItem[] {
    return this.pageData?.courses || [];
  }

  get totalPages(): number {
    return Math.ceil(this.totalElements / this.pageSize) || 1;
  }

  getPagesArray(): (number | string)[] {
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

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadData();
    }
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadData();
  }

  toggleSort(column: string) {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.loadData();
  }

  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
