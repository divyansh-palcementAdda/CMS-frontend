import { Component, EventEmitter, OnInit, Output, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConsultancyService } from '../../../../core/services/consultancy.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-add-consultancy-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './add-consultancy-modal.component.html',
  styleUrls: ['./add-consultancy-modal.component.scss']
})
export class AddConsultancyModalComponent implements OnInit {
  @Input() consultancyId: number | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private consultancyService = inject(ConsultancyService);
  private toastr = inject(ToastrService);

  activeTab: 'single' | 'bulk' = 'single';
  isLoading = false;

  // Single Form State
  consultancyForm!: FormGroup;
  backendErrors: { [key: string]: string } = {};
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

  constructor() { }

  ngOnInit(): void {
    this.initForm();
    this.fetchDropdownData();
    if (this.consultancyId) {
      this.loadConsultancyData();
      this.activeTab = 'single';
    }
  }

  private loadConsultancyData(): void {
    if (!this.consultancyId) return;
    this.isLoading = true;
    this.consultancyService.getConsultancyById(this.consultancyId).subscribe({
      next: (data: any) => {
        const basicInfo = data.basicInfo || data;
        this.consultancyForm.patchValue({
          name: basicInfo.name,
          email: basicInfo.email,
          pan: basicInfo.pan,
          mobile: basicInfo.mobile,
          alternateNo: basicInfo.alternateNo,
          whatsappNo: basicInfo.whatsappNo,
          city: basicInfo.city,
          state: basicInfo.state,
          address: basicInfo.address,
          institutionOrFirmName: basicInfo.institutionOrFirmName,
          commissionPercentage: basicInfo.commissionPercentage,
          status: basicInfo.status || 'ACTIVE',
          courseIds: data.courses?.map((c: any) => c.id) || [],
          institutionIds: data.institutionsOverview?.map((i: any) => i.id) || [],
          representativeIds: data.representatives?.map((r: any) => r.id) || [],
          years: data.yearlyAdmissions?.map((y: any) => y.year) || []
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading consultancy data', err);
        this.isLoading = false;
      }
    });
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
      status: ['ACTIVE', [Validators.required]],
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
      this.toastr.warning('Please check all required fields', 'Form Invalid');
      return;
    }

    this.isSubmitting = true;
    this.backendErrors = {};
    const payload = { ...this.consultancyForm.value };
    delete payload.sameAsMobileAlt;
    delete payload.sameAsMobileWa;

    const request = this.consultancyId 
      ? this.consultancyService.updateConsultancy(this.consultancyId, payload)
      : this.consultancyService.createConsultancy(payload);

    request.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toastr.success(`Consultancy ${this.consultancyId ? 'updated' : 'created'} successfully!`, 'Success');
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
        this.toastr.info('Template download started', 'Downloading');
      },
      error: (err) => {
        console.error("Failed to download template", err);
        this.toastr.error('Failed to download template. Please try again later.', 'Error');
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
        this.toastr.warning("File must be smaller than 2MB", 'File Too Large');
        return;
      }
      if (!isExcel) {
        this.toastr.warning("Only .xlsx, .xls, and .csv files are supported.", 'Unsupported Format');
        return;
      }
      this.selectedFile = file;
      this.toastr.success(`${file.name} selected successfully`, 'File Selected');
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
        if (res.failureCount === 0) {
          this.toastr.success(`Successfully uploaded ${res.successCount} consultancies!`, 'Bulk Upload Success');
          setTimeout(() => {
            this.success.emit();
          }, 2000);
        } else {
          this.toastr.warning(`Uploaded ${res.successCount} with ${res.failureCount} errors.`, 'Partial Success');
        }
      },
      error: (err: any) => {
        this.isUploading = false;
        console.error(err);
        this.toastr.error(err.error?.message || 'Bulk upload failed entirely', 'Server Error');
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
