import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdmissionService } from '../../../../core/services/admission.service';
import { ConsultancyService } from '../../../../core/services/consultancy.service';
import { InstitutionService } from '../../../../core/services/institution.service';
import { CourseService } from '../../../../core/services/course.service';
import { UserService } from '../../../../core/services/user.service';

@Component({
  selector: 'app-admission-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admission-form-modal.component.html',
  styleUrls: ['./admission-form-modal.component.scss']
})
export class AdmissionFormModalComponent implements OnInit, OnChanges {
  @Input() isVisible = false;
  @Input() studentId?: number;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  admissionForm: FormGroup;
  currentStep = 1;
  activeTab: 'single' | 'bulk' = 'single';
  isEditMode = false;
  isSaving = false;
  isUploading = false;
  isSameAsMobile = false;

  // Dropdown Data
  allConsultancies: any[] = [];
  filteredConsultancies: any[] = [];
  allUsers: any[] = [];
  filteredUsers: any[] = [];
  institutions: any[] = [];
  courses: any[] = [];
  filteredCourses: any[] = [];

  // Bulk Upload State
  selectedFile: File | null = null;
  bulkResponse: any = null;
  isDragging = false;

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.validateAndSetFile(file);
    }
  }

  private validateAndSetFile(file: File): void {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
      alert('Only Excel (.xlsx, .xls) files are allowed');
      return;
    }
    this.selectedFile = file;
    this.bulkResponse = null;
  }

  constructor(
    private fb: FormBuilder,
    private admissionService: AdmissionService,
    private consultancyService: ConsultancyService,
    private institutionService: InstitutionService,
    private courseService: CourseService,
    private userService: UserService
  ) {
    this.admissionForm = this.initForm();
  }

  ngOnInit(): void {
    this.loadDropdownData();
    this.setupScholarDiscountLogic();
    this.setupRelationshipFiltering();
  }

  private setupRelationshipFiltering(): void {
    // 1. Source Listener
    this.admissionForm.get('admissionSource')?.valueChanges.subscribe(source => {
      this.resetRelationshipFilters();
    });

    // 2. Consultancy -> Users Filter
    this.admissionForm.get('consultancyId')?.valueChanges.subscribe(consultancyId => {
      if (this.admissionForm.get('admissionSource')?.value === 'CONSULTANCY' && consultancyId) {
        this.filterUsersByConsultancy(Number(consultancyId));
      } else if (!consultancyId) {
        this.filteredUsers = [...this.allUsers];
      }
    });

    // 3. User -> Consultancy Filter
    this.admissionForm.get('admittedByUserId')?.valueChanges.subscribe(userId => {
      if (this.admissionForm.get('admissionSource')?.value === 'CONSULTANCY' && userId && !this.admissionForm.get('consultancyId')?.value) {
        this.filterConsultanciesByUser(Number(userId));
      } else if (!userId && !this.admissionForm.get('consultancyId')?.value) {
        this.filteredConsultancies = [...this.allConsultancies];
      }
    });
  }

  private filterUsersByConsultancy(consultancyId: number): void {
    this.consultancyService.getConsultancyById(consultancyId).subscribe(detail => {
      if (detail && detail.representatives) {
        const mappedUserNames = detail.representatives.map(r => r.name);
        this.filteredUsers = this.allUsers.filter(u => mappedUserNames.includes(u.fullName));
      }
    });
  }

  private filterConsultanciesByUser(userId: number): void {
    this.userService.getUserById(userId).subscribe(user => {
      if (user && user.consultancies) {
        const mappedConsultancyIds = user.consultancies.map(c => c.id);
        this.filteredConsultancies = this.allConsultancies.filter(c => mappedConsultancyIds.includes(c.id));
      }
    });
  }

  private resetRelationshipFilters(): void {
    this.filteredUsers = [...this.allUsers];
    this.filteredConsultancies = [...this.allConsultancies];
  }

  private setupScholarDiscountLogic(): void {
    this.admissionForm.get('isScholar')?.valueChanges.subscribe(isScholar => {
      if (isScholar) {
        this.admissionForm.patchValue({
          discountType: null,
          discountValue: 0
        }, { emitEvent: false });
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisible']?.currentValue) {
      this.resetModal();
      if (this.studentId) {
        this.isEditMode = true;
        this.activeTab = 'single';
        this.loadStudentData(this.studentId);
      } else {
        this.isEditMode = false;
      }
    }
  }

  private initForm(): FormGroup {
    return this.fb.group({
      // Step 1: Personal
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      fatherName: [''],
      motherName: [''],
      dateOfBirth: ['', Validators.required],
      gender: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[6-9]\\d{9}$')]],
      alternatePhone: ['', Validators.pattern('^[6-9]\\d{9}$')],
      whatsappPhoneNo: ['', Validators.pattern('^[6-9]\\d{9}$')],
      city: ['', Validators.required],
      state: ['', Validators.required],
      pincode: ['', [Validators.required, Validators.pattern('^\\d{6}$')]],
      address: ['', [Validators.required, Validators.minLength(5)]],

      // Step 2: Admission
      admissionSource: ['USER', Validators.required],
      consultancyId: [null],
      admittedByUserId: ['', Validators.required],
      institutionId: ['', Validators.required],
      courseId: ['', Validators.required],
      admissionDate: [new Date().toISOString().split('T')[0], Validators.required],
      session: [''],
      discountType: [null],
      discountValue: [0],
      isScholar: [false],
      scholarshipDetails: [''],
      counselorName: ['']
    });
  }

  private loadDropdownData(): void {
    this.consultancyService.getConsultancyData().subscribe(data => {
      this.allConsultancies = data.consultancies;
      this.filteredConsultancies = [...this.allConsultancies];
    });
    this.userService.getUsersData().subscribe(data => {
      this.allUsers = data.users;
      this.filteredUsers = [...this.allUsers];
    });
    this.institutionService.getInstitutionsData().subscribe(data => this.institutions = data.institutions);
    this.courseService.getAllCourses()?.subscribe(data => this.courses = data);
  }

  private loadStudentData(id: number): void {
    this.admissionService.getAdmissionById(id).subscribe({
      next: (data) => {
        this.admissionForm.patchValue(data);
        if (data.institutionId) {
          this.onInstitutionChange();
          // Ensure courseId is set AFTER filteredCourses are loaded
          setTimeout(() => this.admissionForm.get('courseId')?.setValue(data.courseId), 100);
        }
        this.isSameAsMobile = data.phoneNumber === data.whatsappPhoneNo;
      },
      error: (err) => {
        alert('Failed to load student details');
        this.onClose();
      }
    });
  }

  onInstitutionChange(): void {
    const instId = this.admissionForm.get('institutionId')?.value;
    if (instId) {
      this.institutionService.getInstitutionCourses(Number(instId)).subscribe(courses => {
        this.filteredCourses = courses;
      });
    } else {
      this.filteredCourses = [];
    }
  }

  toggleSameAsMobile(): void {
    this.isSameAsMobile = !this.isSameAsMobile;
    if (this.isSameAsMobile) {
      const mobile = this.admissionForm.get('phoneNumber')?.value;
      this.admissionForm.patchValue({
        whatsappPhoneNo: mobile,
        alternatePhone: mobile
      });
    }
  }

  nextStep(): void {
    if (this.currentStep === 1) {
      // Validate Step 1 fields
      const step1Fields = ['fullName', 'dateOfBirth', 'gender', 'email', 'phoneNumber', 'city', 'state', 'pincode', 'address'];
      let isValid = true;
      step1Fields.forEach(field => {
        const control = this.admissionForm.get(field);
        if (control?.invalid) {
          control.markAsTouched();
          isValid = false;
        }
      });
      if (isValid) this.currentStep = 2;
    }
  }

  prevStep(): void {
    if (this.currentStep === 2) this.currentStep = 1;
  }

  setTab(tab: 'single' | 'bulk'): void {
    if (!this.isEditMode) {
      this.activeTab = tab;
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.bulkResponse = null;
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.bulkResponse = null;
  }

  uploadBulk(): void {
    if (!this.selectedFile) return;
    this.isUploading = true;
    this.admissionService.bulkUploadAdmissions(this.selectedFile).subscribe({
      next: (res) => {
        this.isUploading = false;
        this.bulkResponse = res;
        alert('Bulk upload completed!');
      },
      error: (err) => {
        this.isUploading = false;
        alert(err.error?.message || 'Bulk upload failed');
      }
    });
  }

  downloadTemplate(): void {
    this.admissionService.downloadTemplate();
  }

  onSubmit(): void {
    if (this.admissionForm.invalid) {
      this.admissionForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const data = { ...this.admissionForm.value };
    
    // Cleanup: Convert empty strings to null for backend enum/number compatibility
    if (data.discountType === '') data.discountType = null;
    if (data.admittedByUserId === '') data.admittedByUserId = null;
    if (data.consultancyId === '') data.consultancyId = null;

    const request = this.isEditMode 
      ? this.admissionService.updateAdmission(this.studentId!, data)
      : this.admissionService.createAdmission(data);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        alert(this.isEditMode ? 'Admission updated successfully!' : 'Admission created successfully!');
        this.saved.emit();
        this.onClose();
      },
      error: (err) => {
        this.isSaving = false;
        alert(err.error?.message || 'Operation failed');
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }

  private resetModal(): void {
    this.admissionForm.reset(this.initForm().value);
    this.currentStep = 1;
    this.activeTab = 'single';
    this.selectedFile = null;
    this.bulkResponse = null;
    this.isSameAsMobile = false;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.admissionForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
