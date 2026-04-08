import { Component, Inject, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ConsultancyService } from '../../../core/services/consultancy.service';
import { CourseService } from '../../../core/services/course.service';
import { UserService } from '../../../core/services/user.service';
import { AdmissionService } from '../../../core/services/admission.service';

@Component({
  selector: 'app-mapping-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ScrollingModule
  ],
  templateUrl: './mapping-modal.component.html',
  styleUrls: ['./mapping-modal.component.scss']
})
export class MappingModalComponent implements OnInit {
  mappingForm!: FormGroup;

  // Data for selections
  consultancies: any[] = [];
  users: any[] = [];
  courses: any[] = [];

  // Search & Multi-Selection
  userSearchTerm = signal<string>('');
  consultancySearchTerm = signal<string>('');
  courseSearchTerm = signal<string>('');
  
  selectedIds = new Set<number>();
  availableConsultancyIds = new Set<number>(); // IDs linked to selected Rep

  loading: boolean = false;
  private toastr = inject(ToastrService);

  // Multi-step Flow
  currentStep: number = 1;
  isStudentType: boolean = false;

  // Fee Details (Step 2 for Students)
  paymentModes = [
    { value: 'CASH', label: 'Cash' },
    { value: 'UPI', label: 'UPI / QR Code' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CARD', label: 'Credit / Debit Card' },
    { value: 'CHEQUE', label: 'Cheque' }
  ];

  constructor(
    public dialogRef: MatDialogRef<MappingModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { type: string, record: any },
    private fb: FormBuilder,
    private consultancyService: ConsultancyService,
    private userService: UserService,
    private studentService: AdmissionService,
    private courseService: CourseService
  ) { 
    this.isStudentType = this.data.type === 'students';
  }

  ngOnInit(): void {
    this.initForm();
    this.loadDropdowns();
  }

  // Computed filtered lists for the UI
  get filteredUsers() {
    const term = this.userSearchTerm().toLowerCase();
    return this.users.filter(u =>
      (u.fullName?.toLowerCase().includes(term)) ||
      (u.username?.toLowerCase().includes(term)) ||
      (u.email?.toLowerCase().includes(term))
    );
  }

  get filteredCourses() {
    const term = this.courseSearchTerm().toLowerCase();
    return this.courses.filter(c =>
      (c.name?.toLowerCase().includes(term)) ||
      (c.courseType?.toLowerCase().includes(term))
    );
  }

  get filteredConsultancies() {
    const term = this.consultancySearchTerm().toLowerCase();
    const source = this.mappingForm.get('admissionSource')?.value;
    const repSelected = this.mappingForm.get('admittedByUserId')?.value;

    return this.consultancies.filter(c => {
      const matchesSearch = (c.name?.toLowerCase().includes(term)) || (c.email?.toLowerCase().includes(term));
      
      // If internal, hide all consultancies (or show none)
      if (source === 'USER') return false;

      // If student and source is consultancy, filter by linked IDs if a rep is selected
      if (this.isStudentType && source === 'CONSULTANCY' && repSelected) {
        return matchesSearch && this.availableConsultancyIds.has(c.id);
      }
      
      return matchesSearch;
    });
  }

  initForm(): void {
    if (this.isStudentType) {
      this.mappingForm = this.fb.group({
        admissionSource: ['CONSULTANCY', Validators.required],
        consultancyId: [null],
        admittedByUserId: [null],
        discountType: [null],
        discountValue: [0, [Validators.min(0)]],
        isScholar: [false],
        scholarshipDetails: [''],
        
        // Fee Payment Fields (Optional Step 2)
        feeAmount: [null],
        paymentMode: ['CASH'],
        referenceNo: [''],
        remarks: ['']
      });

      // Handle Admission Source changes
      this.mappingForm.get('admissionSource')?.valueChanges.subscribe(source => {
        this.resetSelections();
        if (source === 'CONSULTANCY') {
          this.mappingForm.get('consultancyId')?.setValidators(Validators.required);
        } else {
          this.mappingForm.get('consultancyId')?.clearValidators();
          this.mappingForm.patchValue({ consultancyId: null });
        }
        this.mappingForm.get('consultancyId')?.updateValueAndValidity();
      });

      // Handle Scholar toggle
      this.mappingForm.get('isScholar')?.valueChanges.subscribe(isScholar => {
        if (isScholar) {
          this.mappingForm.patchValue({
            discountType: null,
            discountValue: 0,
            scholarshipDetails: 'Scholarship Applied'
          }, { emitEvent: false });
        }
      });

      // Handle Discount validation triggers
      this.mappingForm.get('discountType')?.valueChanges.subscribe(() => {
        this.updateDiscountValueValidators();
      });
      
      this.updateDiscountValueValidators();
    } else {
      this.mappingForm = this.fb.group({
        selection: [[], Validators.required]
      });
    }
  }

  resetSelections(): void {
    this.selectedIds.clear();
    this.availableConsultancyIds.clear();
    this.mappingForm.patchValue({
      consultancyId: null,
      admittedByUserId: null
    }, { emitEvent: false });
  }

  loadDropdowns(): void {
    this.consultancyService.getConsultancyData().subscribe(res => this.consultancies = res.consultancies);
    this.userService.getUsersByStatus('ACTIVE').subscribe(res => {
      this.users = res.users || res;
    });
    this.courseService.getAllCourses().subscribe(res => {
      this.courses = res;
    });
  }

  toggleSelection(id: number): void {
    if (this.isStudentType) {
      // Single selection for students
      const source = this.mappingForm.get('admissionSource')?.value;
      const isRepSelection = this.isUserItem(id); // Helper needed

      if (isRepSelection) {
        // Toggle selection for Representative
        if (this.mappingForm.get('admittedByUserId')?.value === id) {
          this.mappingForm.patchValue({ admittedByUserId: null, consultancyId: null });
          this.availableConsultancyIds.clear();
        } else {
          this.mappingForm.patchValue({ admittedByUserId: id });
          // Fetch linked consultancies
          this.userService.getUserById(id).subscribe(user => {
            this.availableConsultancyIds.clear();
            if (user.consultancies && user.consultancies.length > 0) {
              user.consultancies.forEach((c: any) => this.availableConsultancyIds.add(c.id));
              
              // Auto-select if only one consultancy exists
              if (user.consultancies.length === 1) {
                this.mappingForm.patchValue({ consultancyId: user.consultancies[0].id });
              } else {
                this.mappingForm.patchValue({ consultancyId: null });
              }
            } else {
              this.mappingForm.patchValue({ consultancyId: null });
            }
          });
        }
      } else {
        // Selection for Consultancy
        if (this.mappingForm.get('consultancyId')?.value === id) {
          this.mappingForm.patchValue({ consultancyId: null });
        } else {
          this.mappingForm.patchValue({ consultancyId: id });
        }
      }
    } else {
      // Multi-selection for other types
      if (this.selectedIds.has(id)) {
        this.selectedIds.delete(id);
      } else {
        this.selectedIds.add(id);
      }
    }
    this.updateFormValue();
  }

  isUserItem(id: number): boolean {
    return this.users.some(u => u.id === id);
  }

  selectAll(items: any[]): void {
    if (this.isStudentType) return; // No select all for students
    const allSelected = items.every(i => this.selectedIds.has(i.id));
    if (allSelected) {
      items.forEach(i => this.selectedIds.delete(i.id));
    } else {
      items.forEach(i => this.selectedIds.add(i.id));
    }
    this.updateFormValue();
  }

  getConsultancyName(id: number): string {
    const consultancy = this.consultancies.find(c => c.id === id);
    return consultancy ? consultancy.name : 'Unknown';
  }

  private updateDiscountValueValidators(): void {
    const type = this.mappingForm.get('discountType')?.value;
    const valueControl = this.mappingForm.get('discountValue');
    
    if (!valueControl) return;

    const maxLimit = type === 'PERCENTAGE' 
      ? 100 
      : (this.data.record?.totalCourseFees || 999999);

    valueControl.setValidators([
      Validators.min(0),
      Validators.max(maxLimit)
    ]);
    valueControl.updateValueAndValidity();
  }

  get discountError(): string | null {
    const control = this.mappingForm.get('discountValue');
    if (control?.errors?.['max']) {
      const type = this.mappingForm.get('discountType')?.value;
      return type === 'PERCENTAGE' 
        ? 'Percentage cannot exceed 100%' 
        : `Amount cannot exceed course fees (₹${this.data.record?.totalCourseFees || 'Total'})`;
    }
    return null;
  }

  private updateFormValue(): void {
    this.mappingForm.get('selection')?.setValue(Array.from(this.selectedIds));
    this.mappingForm.get('selection')?.updateValueAndValidity();
  }

  nextStep(): void {
    if (this.mappingForm.invalid) {
      this.mappingForm.markAllAsTouched();
      this.toastr.warning('Please complete all required fields');
      return;
    }

    // Scholarship students skip the fee entry step
    if (this.mappingForm.get('isScholar')?.value) {
      this.submitMapping();
      return;
    }

    this.currentStep = 2;
  }

  prevStep(): void {
    this.currentStep = 1;
  }

  submitMapping(): void {
    if (this.mappingForm.invalid && this.data.type === 'students') {
      this.mappingForm.markAllAsTouched();
      return;
    }
    if (this.selectedIds.size === 0 && this.data.type !== 'students') return;

    this.loading = true;
    const formValue = this.mappingForm.getRawValue();
    let obs$;

    const recordId = this.data.record.id || this.data.record.userId || this.data.record.consultancyId;

    switch (this.data.type) {
      case 'students':
        const studentId = this.data.record.id || this.data.record.userId;
        const studentPayload = { 
          ...this.data.record, 
          ...formValue,
          id: studentId
        };
        
        this.studentService.updateAdmission(studentId, studentPayload).subscribe({
          next: () => {
            // Check if fees were entered
            if (formValue.feeAmount && formValue.feeAmount > 0) {
              const feeRequest = {
                studentId: studentId,
                amount: formValue.feeAmount,
                paymentMode: formValue.paymentMode,
                referenceNo: formValue.referenceNo,
                remarks: formValue.remarks
              };
              this.studentService.addFeePayment(studentId, feeRequest).subscribe({
                next: () => this.handleSuccess(),
                error: (err) => this.handleError(err)
              });
            } else {
              this.handleSuccess();
            }
          },
          error: (err) => this.handleError(err)
        });
        return;

      case 'users':
        const userRecord = this.data.record;

        // Transform roles from string format or object format to simple string array
        let rolesArray: string[] = ['USER']; // Default
        if (userRecord.roles && Array.isArray(userRecord.roles)) {
          rolesArray = userRecord.roles.map((r: any) => typeof r === 'string' ? r : (r.name || 'USER'));
        } else if (userRecord.role) {
          // If it's a comma-separated string like "Admin, User"
          rolesArray = userRecord.role.split(',').map((r: string) => `ROLE_${r.trim().toUpperCase().replace(/\s+/g, '_')}`);
        }

        const userPayload = {
          ...userRecord,
          roles: rolesArray,
          consultancyIds: Array.from(this.selectedIds),
          password: userRecord.password || '' // If password is required by backend, this is a placeholder
        };

        const userId = userRecord.id || userRecord.userId;
        obs$ = this.userService.updateUser(userId, userPayload);
        break;

      case 'courses':
        const coursePayload = {
          ...this.data.record,
          consultancyIds: Array.from(this.selectedIds)
        };
        obs$ = this.courseService.updateCourse(recordId, coursePayload);
        break;

      case 'consultancies-users':
        const consultancyPayload = {
          ...this.data.record,
          representativeIds: Array.from(this.selectedIds) // ✅ FIXED
        };
        obs$ = this.consultancyService.updateConsultancy(recordId, consultancyPayload);
        break;

      case 'consultancies-courses':
        const consultancyCoursePayload = {
          ...this.data.record,
          courseIds: Array.from(this.selectedIds)
        };
        obs$ = this.consultancyService.updateConsultancy(recordId, consultancyCoursePayload);
        break;
    }

    obs$?.subscribe({
      next: () => this.handleSuccess(),
      error: (err) => this.handleError(err)
    });
  }

  private handleSuccess(): void {
    this.toastr.success('Record mapped successfully');
    this.dialogRef.close(true);
  }

  private handleError(err: any): void {
    this.toastr.error(err.error?.message || 'Mapping failed');
    this.loading = false;
  }
}
