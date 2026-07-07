import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgIf, NgFor, NgClass } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { CourseTargetConfigurationService } from '../../core/services/course-target-configuration.service';
import { CourseService } from '../../core/services/course.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  CourseTargetConfigurationItem,
  CourseTargetConfigurationPageData,
  CourseTargetConfigurationRequest
} from '../../core/models/course-target-configuration.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';
import { MultiSelectModalComponent } from '../../shared/components/multi-select-modal/multi-select-modal.component';

@Component({
  selector: 'app-course-target-configuration-management',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    NgFor,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    SidebarComponent,
    TopbarComponent,
    ConfirmationModalComponent,
    MultiSelectModalComponent
  ],
  templateUrl: './course-target-configuration-management.component.html',
  styleUrls: ['./course-target-configuration-management.component.scss']
})
export class CourseTargetConfigurationManagementComponent implements OnInit, OnDestroy {
  pageData: CourseTargetConfigurationPageData | null = null;
  loading = true;
  searchTerm = '';

  currentPage = 1;
  pageSize = 10;

  private destroy$ = new Subject<void>();

  // Modals and form state
  showAddEditModal = false;
  showDeleteModal = false;
  isEditing = false;
  editingId: number | null = null;
  selectedConfig: CourseTargetConfigurationItem | null = null;
  configForm: FormGroup;
  isSubmitting = false;

  coursesList: any[] = [];
  intervals = ['DAY', 'WEEK', 'MONTH'];

  // Multi course select properties
  selectedCourses: any[] = [];
  activeModal: 'course' | null = null;
  modalItems: any[] = [];
  modalLoading = false;
  modalTotalElements = 0;
  modalCurrentPage = 1;
  modalTotalPages = 1;
  modalPageSize = 10;
  modalSearchText = '';

  constructor(
    private targetService: CourseTargetConfigurationService,
    private courseService: CourseService,
    private notification: NotificationService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.configForm = this.fb.group({
      courseId: [null],
      courseIds: [[], [Validators.required, Validators.minLength(1)]],
      formTargetCount: [0, [Validators.required, Validators.min(0)]],
      formTargetInterval: ['MONTH', Validators.required],
      formTargetIntervalValue: [1, [Validators.required, Validators.min(1)]],
      feeTargetCount: [0, [Validators.required, Validators.min(0)]],
      feeTargetInterval: ['MONTH', Validators.required],
      feeTargetIntervalValue: [1, [Validators.required, Validators.min(1)]],
      active: [true, Validators.required],
      remarks: ['', Validators.maxLength(500)]
    });
  }

  ngOnInit() {
    this.loadData();
    this.loadCourses();
  }

  loadCourses() {
    this.courseService.getAllCourses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.coursesList = data.filter((c: any) => c.active !== false);
        },
        error: (err) => {
          console.error('Error loading courses', err);
          this.notification.error('Error', 'Failed to load courses.');
        }
      });
  }

  loadData() {
    this.loading = true;
    this.targetService.getConfigurationsData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.pageData = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading target configurations', err);
          this.notification.error('Error', 'Failed to load target configurations.');
          this.loading = false;
        }
      });
  }

  // MultiSelect Modal Hooks
  openCourseModal() {
    this.activeModal = 'course';
    this.modalCurrentPage = 1;
    this.modalSearchText = '';
    this.loadModalData();
  }

  loadModalData() {
    this.modalLoading = true;
    this.courseService.getCoursesPaged(
      this.modalCurrentPage - 1,
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
    this.selectedCourses = [...items];
    const ids = items.map(item => item.id);
    this.configForm.get('courseIds')?.setValue(ids);
    this.activeModal = null;
  }

  onModalClose() {
    this.activeModal = null;
  }

  removeCourse(courseId: number) {
    this.selectedCourses = this.selectedCourses.filter(c => c.id !== courseId);
    this.configForm.get('courseIds')?.setValue(this.selectedCourses.map(c => c.id));
  }

  openAddModal() {
    this.isEditing = false;
    this.editingId = null;
    this.selectedCourses = [];
    this.configForm.reset({
      courseId: null,
      courseIds: [],
      formTargetCount: 0,
      formTargetInterval: 'MONTH',
      formTargetIntervalValue: 1,
      feeTargetCount: 0,
      feeTargetInterval: 'MONTH',
      feeTargetIntervalValue: 1,
      active: true,
      remarks: ''
    });
    this.showAddEditModal = true;
  }

  openEditModal(item: CourseTargetConfigurationItem) {
    this.isEditing = true;
    this.editingId = item.id;
    this.selectedCourses = item.courses ? [...item.courses] : [];
    this.configForm.reset({
      courseId: item.courseId,
      courseIds: item.courseIds || [],
      formTargetCount: item.formTargetCount,
      formTargetInterval: item.formTargetInterval,
      formTargetIntervalValue: item.formTargetIntervalValue,
      feeTargetCount: item.feeTargetCount,
      feeTargetInterval: item.feeTargetInterval,
      feeTargetIntervalValue: item.feeTargetIntervalValue,
      active: item.status === 'Active',
      remarks: item.remarks
    });
    this.showAddEditModal = true;
  }

  closeModal() {
    this.showAddEditModal = false;
  }

  onSubmit() {
    if (this.configForm.invalid) {
      this.configForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.configForm.getRawValue();

    const payload: CourseTargetConfigurationRequest = {
      courseId: formValue.courseIds && formValue.courseIds.length > 0 ? formValue.courseIds[0] : null,
      courseIds: formValue.courseIds,
      formTargetCount: formValue.formTargetCount,
      formTargetInterval: formValue.formTargetInterval,
      formTargetIntervalValue: formValue.formTargetIntervalValue,
      feeTargetCount: formValue.feeTargetCount,
      feeTargetInterval: formValue.feeTargetInterval,
      feeTargetIntervalValue: formValue.feeTargetIntervalValue,
      active: formValue.active,
      remarks: formValue.remarks
    };

    if (this.isEditing && this.editingId) {
      this.targetService.updateConfiguration(this.editingId, payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isSubmitting = false;
            this.notification.success('Success', 'Target configuration updated successfully.');
            this.closeModal();
            this.loadData();
          },
          error: (err) => {
            console.error('Error updating target configuration', err);
            const errMsg = err?.error?.message || 'Failed to update target configuration.';
            this.notification.error('Error', errMsg);
            this.isSubmitting = false;
          }
        });
    } else {
      this.targetService.createConfiguration(payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isSubmitting = false;
            this.notification.success('Success', 'Target configuration created successfully.');
            this.closeModal();
            this.loadData();
          },
          error: (err) => {
            console.error('Error creating target configuration', err);
            const errMsg = err?.error?.message || 'Failed to create target configuration.';
            this.notification.error('Error', errMsg);
            this.isSubmitting = false;
          }
        });
    }
  }

  onToggleStatus(item: CourseTargetConfigurationItem) {
    const originalStatus = item.status;
    const isActivating = originalStatus !== 'Active';

    if (isActivating) {
      this.targetService.activateConfiguration(item.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notification.success('Success', 'Configuration activated successfully.');
            this.loadData();
          },
          error: (err) => {
            console.error('Error activating configuration', err);
            const errMsg = err?.error?.message || 'Failed to activate configuration.';
            this.notification.error('Error', errMsg);
          }
        });
    } else {
      this.targetService.deactivateConfiguration(item.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notification.success('Success', 'Configuration deactivated successfully.');
            this.loadData();
          },
          error: (err) => {
            console.error('Error deactivating configuration', err);
            const errMsg = err?.error?.message || 'Failed to deactivate configuration.';
            this.notification.error('Error', errMsg);
          }
        });
    }
  }

  onDelete(item: CourseTargetConfigurationItem) {
    this.selectedConfig = item;
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.selectedConfig = null;
    this.showDeleteModal = false;
  }

  confirmDelete() {
    if (this.selectedConfig) {
      this.loading = true;
      this.targetService.deleteConfiguration(this.selectedConfig.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notification.success('Success', 'Target configuration deleted successfully.');
            this.selectedConfig = null;
            this.showDeleteModal = false;
            this.loadData();
          },
          error: (err) => {
            console.error('Error deleting configuration', err);
            const errMsg = err?.error?.message || 'Failed to delete configuration.';
            this.notification.error('Error', errMsg);
            this.loading = false;
            this.showDeleteModal = false;
          }
        });
    }
  }

  get filteredConfigurations(): CourseTargetConfigurationItem[] {
    if (!this.pageData) return [];
    let list = this.pageData.configurations;

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(item =>
        item.courseName.toLowerCase().includes(term) ||
        (item.remarks && item.remarks.toLowerCase().includes(term))
      );
    }
    return list;
  }

  get paginatedConfigurations(): CourseTargetConfigurationItem[] {
    const list = this.filteredConfigurations;
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return list.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredConfigurations.length / this.pageSize) || 1;
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
