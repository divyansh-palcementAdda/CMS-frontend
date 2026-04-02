import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CourseService } from '../../../../core/services/course.service';
import { CourseTypeService } from '../../../../core/services/course-type.service';
import { InstitutionService } from '../../../../core/services/institution.service';
import { BulkUploadResponse } from '../../../../core/models/course.model';

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

  activeTab: 'single' | 'bulk' = 'single';
  
  // Single form
  courseForm!: FormGroup;
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

  constructor(
    private fb: FormBuilder,
    private courseService: CourseService,
    private courseTypeService: CourseTypeService,
    private institutionService: InstitutionService
  ) {
    this.initForm();
  }

  ngOnInit() {
    this.loadCourseTypes();
    this.loadInstitutions();
  }

  initForm() {
    this.courseForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      isOnline: [null, [Validators.required]],
      active: [true, [Validators.required]],
      duration: [null, [Validators.required]],
      fees: [null, [Validators.required, Validators.min(0)]],
      courseTypeId: [null, [Validators.required]],
      institutionIds: [[]]
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
      return;
    }

    this.isSubmitting = true;
    const payload = {
      ...this.courseForm.value,
      isOnline: this.courseForm.value.isOnline === 'true' || this.courseForm.value.isOnline === true,
      active: this.courseForm.value.active === 'true' || this.courseForm.value.active === true,
      duration: Number(this.courseForm.value.duration),
      fees: Number(this.courseForm.value.fees),
      courseTypeId: Number(this.courseForm.value.courseTypeId)
    };

    this.courseService.createCourse(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.success.emit();
        this.onClose();
      },
      error: (err) => {
        console.error('Failed to create course', err);
        this.isSubmitting = false;
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
    } else {
      alert('Please upload a valid Excel or CSV file.');
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
        // Optionally emit success if everything succeeded
        if (res.failureCount === 0) {
          setTimeout(() => {
            this.success.emit();
            this.onClose();
          }, 3000); // give user time to read success message before closing
        }
      },
      error: (err: any) => {
        console.error('Bulk upload failed', err);
        this.isUploading = false;
        alert('Bulk upload failed. See console for details.');
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
      },
      error: (err: any) => {
        console.error('Failed to download template', err);
        alert('Failed to download template. Please try again later.');
      }
    });
  }

  onClose() {
    this.close.emit();
  }
}
