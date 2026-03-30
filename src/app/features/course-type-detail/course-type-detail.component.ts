import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { CourseTypeService } from '../../core/services/course-type.service';
import { CourseService } from '../../core/services/course.service';
import { CourseTypeItem } from '../../core/models/course-type.model';
import { CoursePageData, CourseItem } from '../../core/models/course.model';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-course-type-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, TopbarComponent, ConfirmationModalComponent],
  templateUrl: './course-type-detail.component.html',
  styleUrls: ['./course-type-detail.component.scss']
})
export class CourseTypeDetailComponent implements OnInit, OnDestroy {
  typeId!: number;
  loading = true;
  typeDetail: CourseTypeItem | null = null;
  coursesPageData: CoursePageData | null = null;
  searchTerm = '';
  currentPage = 1;
  pageSize = 10;
  private destroy$ = new Subject<void>();

  // Actions
  showDeleteModal = false;
  deleteType: string = '';
  itemToDelete: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseTypeService: CourseTypeService,
    private courseService: CourseService
  ) {}

  ngOnInit() {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.typeId = +idParam;
        this.loadData();
      }
    });
  }

  onEdit() {
    this.router.navigate([], { fragment: 'edit' });
  }

  goBack() {
    this.router.navigate(['/course-types']);
  }

  onDelete() {
    this.deleteType = 'CourseType';
    this.itemToDelete = this.typeDetail;
    this.showDeleteModal = true;
  }

  // Course Actions
  onViewCourse(id: number) {
    this.router.navigate(['/courses', id]);
  }

  onEditCourse(id: number) {
    this.router.navigate(['/courses', id], { fragment: 'edit' });
  }

  onDeleteCourse(course: CourseItem) {
    this.deleteType = 'Course';
    this.itemToDelete = course;
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.itemToDelete = null;
  }

  confirmDelete() {
    if (!this.itemToDelete) return;

    this.loading = true;
    let deleteObservable;

    if (this.deleteType === 'CourseType') {
      deleteObservable = this.courseTypeService.deleteCourseType(this.typeId);
    } else {
      deleteObservable = this.courseService.deleteCourse(this.itemToDelete.id);
    }

    deleteObservable.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.itemToDelete = null;
        if (this.deleteType === 'CourseType') {
          this.router.navigate(['/course-types']);
        } else {
          this.loadData();
        }
      },
      error: (err: any) => {
        console.error(`Error deleting ${this.deleteType}`, err);
        this.loading = false;
        this.showDeleteModal = false;
      }
    });
  }

  loadData() {
    this.loading = true;
    forkJoin({
      type: this.courseTypeService.getCourseTypeById(this.typeId),
      courses: this.courseService.getCoursesByType(this.typeId)
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.typeDetail = res.type;
        this.coursesPageData = res.courses;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading course type details', err);
        this.loading = false;
      }
    });
  }

  get filteredCourses(): CourseItem[] {
    if (!this.coursesPageData) return [];
    let list = this.coursesPageData.courses;
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
