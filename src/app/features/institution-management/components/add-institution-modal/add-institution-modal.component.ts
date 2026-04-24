import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { InstitutionService } from '../../../../core/services/institution.service';
import { CourseService } from '../../../../core/services/course.service';
import { BulkUploadResponse } from '../../../../core/models/institution.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-add-institution-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './add-institution-modal.component.html',
  styleUrl: './add-institution-modal.component.scss'
})
export class AddInstitutionModalComponent implements OnInit {
  @Input() isVisible = false;
  @Input() institutionId: number | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private institutionService = inject(InstitutionService);
  private courseService = inject(CourseService);
  private toastr = inject(ToastrService);

  activeTab: 'single' | 'bulk' = 'single';
  institutionForm: FormGroup;
  backendErrors: { [key: string]: string } = {};
  isSubmitting = false;
  isLoading = false;

  // Relational data
  availableCourses: any[] = [];
  filteredCourses: any[] = [];
  courseSearchTerm = '';
  selectedCourseIds: Set<number> = new Set();

  // Bulk Upload State
  selectedFile: File | null = null;
  isDragging = false;
  bulkUploadResult: BulkUploadResponse | null = null;
  isUploading = false;

  institutionTypes = ['University', 'College', 'Vocational', 'Language School', 'Other'];

  constructor() {
    this.institutionForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      code: ['', [Validators.required]],
      institutionType: ['', [Validators.required]],
      description: [''],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9+ ]{10,15}$')]],
      website: [''],
      establishedYear: [null, [Validators.min(1800), Validators.max(new Date().getFullYear())]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      country: ['India', [Validators.required]],
      pincode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]],
      status: ['ACTIVE', [Validators.required]]
    });
  }

  ngOnChanges(changes: any): void {
    if (changes['isVisible']?.currentValue === true) {
      if (this.institutionId) {
        this.loadInstitutionData();
      } else {
        this.institutionForm.reset({ status: 'ACTIVE', country: 'India' });
        this.selectedCourseIds.clear();
      }
    }
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInstitutionData(): void {
    if (!this.institutionId) return;
    this.isLoading = true;
    this.institutionService.getInstitutionById(this.institutionId).subscribe({
      next: (data) => {
        this.isLoading = false;
        this.institutionForm.patchValue({
          ...data,
          status: data.status || 'ACTIVE'
        });
        if (data.courseIds) {
          this.selectedCourseIds = new Set(data.courseIds);
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load institution details', err);
      }
    });
  }

  loadInitialData(): void {
    // Load courses for the checklist
    this.courseService.getAllCourses().subscribe({
      next: (courses) => {
        this.availableCourses = Array.isArray(courses) ? courses : (courses as any).data || [];
        this.filteredCourses = [...this.availableCourses];
      },
      error: (err) => console.error('Failed to load courses', err)
    });
  }

  // --- Single Record Handlers ---
  filterCourses(): void {
    const term = this.courseSearchTerm.toLowerCase();
    this.filteredCourses = this.availableCourses.filter(c =>
      c.name.toLowerCase().includes(term)
    );
  }

  toggleCourse(id: number): void {
    if (this.selectedCourseIds.has(id)) {
      this.selectedCourseIds.delete(id);
    } else {
      this.selectedCourseIds.add(id);
    }
  }

  isCourseSelected(id: number): boolean {
    return this.selectedCourseIds.has(id);
  }

  onSubmit(): void {
    if (this.institutionForm.invalid || this.isSubmitting) {
      this.markFormGroupTouched(this.institutionForm);
      this.toastr.warning('Please check all required fields', 'Form Invalid');
      return;
    }

    this.isSubmitting = true;
    this.backendErrors = {};
    const payload = {
      ...this.institutionForm.value,
      courseIds: Array.from(this.selectedCourseIds)
    };

    const request = this.institutionId
      ? this.institutionService.updateInstitution(this.institutionId, payload)
      : this.institutionService.createInstitution(payload);

    request.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toastr.success(`Institution ${this.institutionId ? 'updated' : 'created'} successfully!`, 'Success');
        this.resetAndClose();
        this.success.emit();
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error(err);
        if (err.error?.errors) {
          this.backendErrors = err.error.errors;
          this.toastr.error('Validation failed. Please check individual fields.', 'Error');
        } else {
          this.toastr.error(err.error?.detail || err.error?.message || 'Server error occurred', 'Operation Failed');
        }
      }
    });
  }

  // --- Bulk Upload Handlers ---
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) this.validateAndSetFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.validateAndSetFile(file);
  }

  private validateAndSetFile(file: File): void {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls' && ext !== 'csv') {
      this.toastr.warning('Only Excel (.xlsx, .xls) or CSV files are allowed', 'Invalid File');
      return;
    }
    this.selectedFile = file;
    this.bulkUploadResult = null;
    this.toastr.success(`${file.name} selected successfully`, 'File Selected');
  }

  onSubmitBulk(): void {
    if (!this.selectedFile || this.isUploading) return;

    this.isUploading = true;
    this.institutionService.bulkUpload(this.selectedFile).subscribe({
      next: (res: any) => {
        this.isUploading = false;
        this.bulkUploadResult = res.data || res;
        this.selectedFile = null;
        if (this.bulkUploadResult?.failureCount === 0) {
          this.toastr.success(`Successfully uploaded ${this.bulkUploadResult?.successCount} institutions!`, 'Bulk Upload Success');
          setTimeout(() => {
            this.success.emit();
            this.resetAndClose();
          }, 2000);
        } else {
          this.toastr.warning(`Uploaded ${this.bulkUploadResult?.successCount} with ${this.bulkUploadResult?.failureCount} errors.`, 'Partial Success');
        }
      },
      error: (err: any) => {
        this.isUploading = false;
        this.toastr.error(err.error?.message || 'Bulk upload failed', 'Error');
      }
    });
  }

  downloadTemplate(): void {
    this.institutionService.downloadTemplate();
  }

  // --- Helpers ---
  switchTab(tab: 'single' | 'bulk'): void {
    this.activeTab = tab;
    this.bulkUploadResult = null;
  }

  resetAndClose(): void {
    this.institutionForm.reset({
      status: 'ACTIVE',
      country: 'India'
    });
    this.selectedCourseIds.clear();
    this.selectedFile = null;
    this.bulkUploadResult = null;
    this.activeTab = 'single';
    this.close.emit();
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }
}
