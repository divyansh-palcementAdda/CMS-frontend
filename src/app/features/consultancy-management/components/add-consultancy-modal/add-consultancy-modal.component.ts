import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConsultancyService } from '../../../../core/services/consultancy.service';

@Component({
  selector: 'app-add-consultancy-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './add-consultancy-modal.component.html',
  styleUrls: ['./add-consultancy-modal.component.scss']
})
export class AddConsultancyModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  activeTab: 'single' | 'bulk' = 'single';

  // Single Form State
  consultancyForm!: FormGroup;
  lookupData = {
    institutions: [] as any[],
    courses: [] as any[],
    users: [] as any[]
  };
  isLoadingLookups = false;
  isSubmitting = false;

  // Year Selection State
  currentYear = new Date().getFullYear();
  availableYears = Array.from({ length: 11 }, (_, i) => this.currentYear - 5 + i); // range: [curr-5, curr+5]
  showYearDropdown = false;

  // Bulk Upload State
  selectedFile: File | null = null;
  bulkUploadResult: any = null;
  isUploading = false;

  // Search state for checklists
  searchCourses = '';
  searchInstitutions = '';
  searchUsers = '';

  constructor(
    private fb: FormBuilder,
    private consultancyService: ConsultancyService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.fetchDropdownData();
  }

  private initForm(): void {
    this.consultancyForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.email]],
      pan: ['', [Validators.pattern('^[A-Z]{5}[0-9]{4}[A-Z]{1}$')]],
      mobile: ['', [Validators.required, Validators.pattern('^[6-9]\\d{9}$')]],
      alternateNo: ['', [Validators.pattern('^[6-9]\\d{9}$')]],
      sameAsMobileAlt: [false],
      whatsappNo: ['', [Validators.pattern('^[6-9]\\d{9}$')]],
      sameAsMobileWa: [false],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      address: ['', [Validators.maxLength(255)]],
      institutionOrFirmName: ['', [Validators.required]],
      commissionPercentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      courseIds: [[]],
      institutionIds: [[]],
      representativeIds: [[], [Validators.required]],
      years: [[]]
    });

    // Handle initial status based logic
    this.handleStatusChange(this.consultancyForm.get('status')?.value);

    // Status change listener
    this.consultancyForm.get('status')?.valueChanges.subscribe(status => {
      this.handleStatusChange(status);
    });

    // Handle "Same as Mobile Number" logic
    this.consultancyForm.get('sameAsMobileAlt')?.valueChanges.subscribe(checked => {
      if (checked) {
        this.consultancyForm.patchValue({ alternateNo: this.consultancyForm.get('mobile')?.value });
      } else {
        this.consultancyForm.patchValue({ alternateNo: '' });
      }
    });

    this.consultancyForm.get('sameAsMobileWa')?.valueChanges.subscribe(checked => {
      if (checked) {
        this.consultancyForm.patchValue({ whatsappNo: this.consultancyForm.get('mobile')?.value });
      } else {
        this.consultancyForm.patchValue({ whatsappNo: '' });
      }
    });

    this.consultancyForm.get('mobile')?.valueChanges.subscribe(val => {
      if (this.consultancyForm.get('sameAsMobileAlt')?.value) {
        this.consultancyForm.patchValue({ alternateNo: val });
      }
      if (this.consultancyForm.get('sameAsMobileWa')?.value) {
        this.consultancyForm.patchValue({ whatsappNo: val });
      }
    });
  }

  private fetchDropdownData(): void {
    this.isLoadingLookups = true;

    // Fire requests concurrently if possible, or serially
    this.consultancyService.getActiveInstitutions().subscribe({
      next: (res) => { this.lookupData.institutions = res.data || res; },
      error: (err) => console.error("Failed to load institutions", err)
    });

    this.consultancyService.getActiveCourses().subscribe({
      next: (res) => { this.lookupData.courses = res.data || res; },
      error: (err) => console.error("Failed to load courses", err)
    });

    this.consultancyService.getActiveUsers().subscribe({
      next: (res) => { this.lookupData.users = res.data || res; },
      error: (err) => console.error("Failed to load users", err),
      complete: () => { this.isLoadingLookups = false; }
    });
  }

  // --- Checklist Helper Methods ---

  get filteredCourses() {
    let filtered = this.lookupData.courses;
    const selectedInsts = this.consultancyForm.get('institutionIds')?.value || [];
    const selectedCourses = this.consultancyForm.get('courseIds')?.value || [];

    if (selectedInsts.length > 0) {
      filtered = filtered.filter(c => selectedCourses.includes(c.id) || selectedInsts.some((id: number) => c.institutionIds?.includes(id)));
    }

    if (this.searchCourses) {
      const term = this.searchCourses.toLowerCase();
      filtered = filtered.filter(c => c.name.toLowerCase().includes(term));
    }
    return filtered;
  }

  get filteredInstitutions() {
    let filtered = this.lookupData.institutions;
    const selectedCourses = this.consultancyForm.get('courseIds')?.value || [];
    const selectedInsts = this.consultancyForm.get('institutionIds')?.value || [];

    if (selectedCourses.length > 0) {
      filtered = filtered.filter(inst => selectedInsts.includes(inst.id) || selectedCourses.some((id: number) => inst.courseIds?.includes(id)));
    }

    if (this.searchInstitutions) {
      const term = this.searchInstitutions.toLowerCase();
      filtered = filtered.filter(i => i.name.toLowerCase().includes(term));
    }
    return filtered;
  }

  get filteredUsers() {
    let filtered = this.lookupData.users;
    if (this.searchUsers) {
      const term = this.searchUsers.toLowerCase();
      filtered = filtered.filter(u => (u.fullName || u.email).toLowerCase().includes(term));
    }
    return filtered;
  }

  toggleSelection(controlName: string, id: any) {
    const control = this.consultancyForm.get(controlName);
    const currentValues = control?.value || [];
    if (this.isYearRestricted(id)) return;

    if (currentValues.includes(id)) {
      control?.setValue(currentValues.filter((v: any) => v !== id));
    } else {
      control?.setValue([...currentValues, id]);
    }
  }

  isYearRestricted(year: number): boolean {
    const status = this.consultancyForm.get('status')?.value;
    if (status === 'INACTIVE') return true;
    if (status === 'DORMANT' && year === this.currentYear) return true;
    return false;
  }

  private handleStatusChange(status: string) {
    const yearsControl = this.consultancyForm.get('years');
    const currentValues = yearsControl?.value || [];

    if (status === 'ACTIVE') {
      // 2026 or present year is selected automatically
      if (!currentValues.includes(this.currentYear)) {
        yearsControl?.setValue([...currentValues, this.currentYear]);
      }
    } else if (status === 'DORMANT') {
      // Restricted from selecting present year
      yearsControl?.setValue(currentValues.filter((y: number) => y !== this.currentYear));
    } else if (status === 'INACTIVE') {
      // Not able to select years at all
      yearsControl?.setValue([]);
    }
  }

  isSelected(controlName: string, id: number) {
    return (this.consultancyForm.get(controlName)?.value || []).includes(id);
  }

  switchTab(tab: 'single' | 'bulk'): void {
    this.activeTab = tab;
  }

  // --- Single Methods ---

  onSubmitSingle(): void {
    if (this.consultancyForm.invalid) {
      this.consultancyForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const payload = { ...this.consultancyForm.value };
    delete payload.sameAsMobileAlt; // cleanup non-backend field
    delete payload.sameAsMobileWa;

    this.consultancyService.createConsultancy(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.success.emit();
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error(err);
        alert('Failed to create consultancy. ' + (err.error?.message || 'Check inputs.'));
      }
    });
  }

  // --- Bulk Methods ---

  downloadTemplate(): void {
    this.consultancyService.downloadTemplate().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Consultancy_Bulk_Upload_Template.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error("Failed to download template", err);
        alert("Failed to string template.");
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    this.handleFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer?.files.length) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  private handleFile(file: File): void {
    if (file) {
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv');
      if (file.size > 2 * 1024 * 1024) {
        alert("File must be smaller than 2MB");
        return;
      }
      if (!isExcel) {
        alert("Only .xlsx, .xls, and .csv files are supported.");
        return;
      }
      this.selectedFile = file;
    }
  }

  onSubmitBulk(): void {
    if (!this.selectedFile) return;

    this.isUploading = true;
    this.bulkUploadResult = null;

    this.consultancyService.bulkUpload(this.selectedFile).subscribe({
      next: (res: any) => {
        this.isUploading = false;
        this.bulkUploadResult = res; // Contains successCount, failureCount, failures[]
      },
      error: (err: any) => {
        this.isUploading = false;
        console.error(err);
        alert("Bulk upload failed entirely: " + (err.error?.message || 'Server Error'));
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
