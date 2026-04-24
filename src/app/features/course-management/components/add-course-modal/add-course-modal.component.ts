import { Component, EventEmitter, Output, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { CourseService } from '../../../../core/services/course.service';
import { CourseTypeService } from '../../../../core/services/course-type.service';
import { InstitutionService } from '../../../../core/services/institution.service';
import { BulkUploadResponse } from '../../../../core/models/course.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-add-course-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './add-course-modal.component.html',
  styleUrls: ['./add-course-modal.component.scss']
})
export class AddCourseModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();
  @Input() editId: number | null = null;

  private fb = inject(FormBuilder);
  private courseService = inject(CourseService);
  private courseTypeService = inject(CourseTypeService);
  private institutionService = inject(InstitutionService);
  private toastr = inject(ToastrService);

  activeTab: 'single' | 'bulk' = 'single';

  // Single form
  courseForm!: FormGroup;
  backendErrors: { [key: string]: string } = {};
  isSubmitting = false;

  courseTypes: any[] = [];
  institutions: any[] = [];
  filteredInstitutions: any[] = [];
  searchInstitutions: string = '';

  // Bulk Upload
  selectedFile: File | null = null;
  isUploading = false;
  bulkUploadResult: BulkUploadResponse | null = null;
  isDragging = false;

  constructor() { }

  ngOnInit() {
    this.initForm();
    this.loadCourseTypes();
    this.loadInstitutions();

    if (this.editId) {
      this.loadCourseForEdit();
    }
  }

  initForm() {
    this.courseForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      isOnline: [null, [Validators.required]],
      active: [true, [Validators.required]],
      duration: [null, [Validators.required]],
      fees: [null, [Validators.required, Validators.min(0)]],
      courseTypeId: [null, [Validators.required]],
      institutionIds: [[]],
      consultancyIds: [[]]
    });
  }

  loadCourseForEdit() {
    if (!this.editId) return;
    this.courseService.getCourseById(this.editId).subscribe(course => {
      if (course) {
        this.courseForm.patchValue({
          name: course.name,
          isOnline: !!course.isOnline,
          active: !!course.active,
          duration: course.duration,
          fees: course.fees,
          courseTypeId: course.courseTypeId,
          institutionIds: course.institutionIds || []
        });
      }
    });
  }

  loadCourseTypes() {
    this.courseTypeService.getCourseTypesData().subscribe({
      next: (res: any) => {
        this.courseTypes = res?.courseTypes || res?.data || res || [];
      },
      error: (err: any) => console.error('Error loading course types', err)
    });
  }

  loadInstitutions() {
    this.institutionService.getInstitutionsData().subscribe({
      next: (res) => {
        this.institutions = res.institutions || [];
        this.filteredInstitutions = [...this.institutions];
      },
      error: (err) => console.error('Error loading institutions', err)
    });
  }

  switchTab(tab: 'single' | 'bulk') {
    if (this.editId && tab === 'bulk') return; // Prevent bulk in edit mode
    this.activeTab = tab;
    this.bulkUploadResult = null;
    this.selectedFile = null;
  }

  // --- Single Flow ---

  toggleSelection(controlName: string, id: number) {
    const control = this.courseForm.get(controlName);
    const currentValues = control?.value || [];

    if (currentValues.includes(id)) {
      control?.setValue(currentValues.filter((v: number) => v !== id));
    } else {
      control?.setValue([...currentValues, id]);
    }
  }

  isSelected(controlName: string, id: number): boolean {
    const control = this.courseForm.get(controlName);
    return control?.value?.includes(id) || false;
  }

  onSearchInstitutionsChange() {
    const term = this.searchInstitutions.toLowerCase();
    this.filteredInstitutions = this.institutions.filter(inst =>
      inst.name.toLowerCase().includes(term) || inst.code.toLowerCase().includes(term)
    );
  }

  onSubmitSingle() {
    if (this.courseForm.invalid) {
      this.courseForm.markAllAsTouched();
      this.toastr.warning('Please check all required fields', 'Form Invalid');
      return;
    }

    this.isSubmitting = true;
    this.backendErrors = {};
    const payload = {
      ...this.courseForm.value,
      isOnline: this.courseForm.value.isOnline === 'true' || this.courseForm.value.isOnline === true,
      active: this.courseForm.value.active === 'true' || this.courseForm.value.active === true,
      duration: Number(this.courseForm.value.duration),
      fees: Number(this.courseForm.value.fees),
      courseTypeId: Number(this.courseForm.value.courseTypeId)
    };

    const request = this.editId
      ? this.courseService.updateCourse(this.editId, payload)
      : this.courseService.createCourse(payload);

    request.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toastr.success(`Course ${this.editId ? 'updated' : 'created'} successfully!`, 'Success');
        this.success.emit();
        this.onClose();
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

  // --- Bulk Flow ---

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.handleFile(event.target.files[0]);
    }
  }

  handleFile(file: File) {
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
    if (validTypes.includes(file.type) || file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
      this.selectedFile = file;
      this.toastr.success(`${file.name} selected successfully`, 'File Selected');
    } else {
      this.toastr.warning('Please upload a valid Excel or CSV file.', 'Invalid File');
    }
  }

  onSubmitBulk() {
    if (!this.selectedFile) return;

    this.isUploading = true;
    this.bulkUploadResult = null;

    this.courseService.bulkUpload(this.selectedFile).subscribe({
      next: (res: any) => {
        this.isUploading = false;
        this.bulkUploadResult = res;
        if (res.failureCount === 0) {
          this.toastr.success(`Successfully uploaded ${res.successCount} courses!`, 'Bulk Upload Success');
          setTimeout(() => {
            this.success.emit();
            this.onClose();
          }, 3000);
        } else {
          this.toastr.warning(`Uploaded ${res.successCount} with ${res.failureCount} errors.`, 'Partial Success');
        }
      },
      error: (err: any) => {
        console.error('Bulk upload failed', err);
        this.isUploading = false;
        this.toastr.error(err.error?.message || 'Bulk upload failed', 'Error');
      }
    });
  }

  downloadTemplate() {
    this.courseService.downloadTemplate().subscribe({
      next: (blob: any) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'course-bulk-upload-template.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.toastr.info('Template download started', 'Downloading');
      },
      error: (err: any) => {
        console.error('Failed to download template', err);
        this.toastr.error('Failed to download template. Please try again later.', 'Error');
      }
    });
  }

  onClose() {
    this.close.emit();
  }
}
