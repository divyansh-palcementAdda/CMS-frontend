import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgIf, NgFor, NgClass } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { CourseTypeService } from '../../core/services/course-type.service';
import { CourseTypeItem, CourseTypePageData, CreateCourseTypeDTO } from '../../core/models/course-type.model';
import { CourseService } from '../../core/services/course.service';
import { CourseItem } from '../../core/models/course.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';
import { BulkUploadModalComponent } from '../../shared/components/bulk-upload-modal/bulk-upload-modal.component';

@Component({
  selector: 'app-course-type-management',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, FormsModule, ReactiveFormsModule, RouterModule, SidebarComponent, TopbarComponent, ConfirmationModalComponent, BulkUploadModalComponent],
  templateUrl: './course-type-management.component.html',
  styleUrls: ['./course-type-management.component.scss']
})
export class CourseTypeManagementComponent implements OnInit, OnDestroy {
  pageData: CourseTypePageData | null = null;
  loading = true;
  searchTerm = '';

  currentPage = 1;
  pageSize = 10;

  private destroy$ = new Subject<void>();

  // Actions
  showDeleteModal = false;
  selectedCourseType: CourseTypeItem | null = null;
  showAddModal = false;
  addForm: FormGroup;
  isSubmitting = false;
  coursesList: CourseItem[] = [];

  // Bulk Upload
  showBulkUploadModal = false;

  constructor(
    public courseTypeService: CourseTypeService,
    private courseService: CourseService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.addForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, this.wordCountValidator(150)]],
      courseId: [null], // Optional as per user
      status: ['Active', Validators.required]
    });
  }

  ngOnInit() {
    this.loadData();
    this.loadCourses();
  }

  loadCourses() {
    this.courseService.getCoursesData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.coursesList = data.courses;
        },
        error: (err) => console.error('Error loading courses', err)
      });
  }

  openAddModal() {
    this.addForm.reset({ status: 'Active' });
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
  }

  wordCountValidator(maxWords: number) {
    return (control: AbstractControl) => {
      if (!control.value) return null;
      const words = control.value.trim().split(/\s+/).length;
      return words > maxWords ? { maxWords: { limit: maxWords, actual: words } } : null;
    };
  }

  onSubmit() {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    const formValue = this.addForm.value;
    const payload: CreateCourseTypeDTO = {
      name: formValue.name,
      description: formValue.description,
      active: formValue.status === 'Active',
      courseId: formValue.courseId
    };

    this.courseTypeService.createCourseType(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.closeAddModal();
          this.loadData();
        },
        error: (err) => {
          console.error('Error creating course type', err);
          this.isSubmitting = false;
        }
      });
  }

  onBulkUploadSuccess(result: any) {
    this.loadData();
  }

  onView(id: number) {
    this.router.navigate(['/course-types', id]);
  }

  onEdit(id: number) {
    this.router.navigate([], { fragment: 'edit' });
  }

  onDelete(courseType: CourseTypeItem) {
    this.selectedCourseType = courseType;
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.selectedCourseType = null;
    this.showDeleteModal = false;
  }

  confirmDelete() {
    if (this.selectedCourseType) {
      this.loading = true;
      this.courseTypeService.deleteCourseType(this.selectedCourseType.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.selectedCourseType = null;
            this.showDeleteModal = false;
            this.loadData();
          },
          error: (err: any) => {
            console.error('Error deleting course type', err);
            this.loading = false;
            this.showDeleteModal = false;
          }
        });
    }
  }

  loadData() {
    this.loading = true;
    this.courseTypeService.getCourseTypesData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.pageData = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading course type data', err);
          this.loading = false;
        }
      });
  }

  get filteredCourseTypes(): CourseTypeItem[] {
    if (!this.pageData) return [];
    let list = this.pageData.courseTypes;

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.code.toLowerCase().includes(term)
      );
    }
    return list;
  }

  get paginatedCourseTypes(): CourseTypeItem[] {
    const list = this.filteredCourseTypes;
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return list.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCourseTypes.length / this.pageSize) || 1;
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
