import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { CourseService } from '../../core/services/course.service';
import { CourseItem, CoursePageData } from '../../core/models/course.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';
import { AddCourseModalComponent } from './components/add-course-modal/add-course-modal.component';
import { BulkUploadModalComponent } from '../../shared/components/bulk-upload-modal/bulk-upload-modal.component';

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
  
  private destroy$ = new Subject<void>();

  // Actions
  showDeleteModal = false;
  selectedCourse: CourseItem | null = null;
  showAddModal = false;
  showBulkUploadModal = false;
  editCourseId: number | null = null;

  constructor(
    public courseService: CourseService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

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
    this.showAddModal = false;
    this.editCourseId = null;
  }

  onAddSuccess() {
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
    this.route.queryParams.subscribe(params => {
      const active = params['active'];
      if (active !== undefined) {
        this.loadFilteredData(active === 'true');
      } else {
        this.loadData();
      }
    });
  }

  loadFilteredData(active: boolean) {
    this.loading = true;
    this.courseService.getCoursesByActive(active)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.pageData = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading filtered course data', err);
          this.loading = false;
        }
      });
  }

  loadData() {
    this.loading = true;
    this.courseService.getCoursesData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.pageData = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading course data', err);
          this.loading = false;
        }
      });
  }

  get filteredCourses(): CourseItem[] {
    if (!this.pageData) return [];
    let list = this.pageData.courses;

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(item => 
        item.name.toLowerCase().includes(term) ||
        item.courseType.toLowerCase().includes(term)
      );
    }
    return list;
  }

  get paginatedCourses(): CourseItem[] {
    const list = this.filteredCourses;
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return list.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCourses.length / this.pageSize) || 1;
  }

  getPagesArray(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const maxVisible = 5;
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = Math.min(total, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    start = Math.max(1, start);

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
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
