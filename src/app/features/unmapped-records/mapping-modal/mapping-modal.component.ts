import { Component, Inject, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    ReactiveFormsModule
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
  searchTerm = signal<string>('');
  selectedIds = new Set<number>();

  loading: boolean = false;
  private toastr = inject(ToastrService);

  constructor(
    public dialogRef: MatDialogRef<MappingModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { type: string, record: any },
    private fb: FormBuilder,
    private consultancyService: ConsultancyService,
    private userService: UserService,
    private studentService: AdmissionService,
    private courseService: CourseService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadDropdowns();
  }

  // Computed filtered lists for the UI
  get filteredUsers() {
    const term = this.searchTerm().toLowerCase();
    return this.users.filter(u =>
      (u.name?.toLowerCase().includes(term)) ||
      (u.fullName?.toLowerCase().includes(term)) ||
      (u.email?.toLowerCase().includes(term))
    );
  }

  get filteredCourses() {
    const term = this.searchTerm().toLowerCase();
    return this.courses.filter(c =>
      (c.name?.toLowerCase().includes(term)) ||
      (c.courseType?.toLowerCase().includes(term))
    );
  }

  get filteredConsultancies() {
    const term = this.searchTerm().toLowerCase();
    return this.consultancies.filter(c =>
      (c.name?.toLowerCase().includes(term)) ||
      (c.email?.toLowerCase().includes(term))
    );
  }

  initForm(): void {
    if (this.data.type === 'students') {
      this.mappingForm = this.fb.group({
        admissionSource: ['CONSULTANCY', Validators.required],
        consultancyId: [null],
        admittedByUserId: [null]
      });

      this.mappingForm.get('admissionSource')?.valueChanges.subscribe(source => {
        if (source === 'CONSULTANCY') {
          this.mappingForm.get('consultancyId')?.setValidators(Validators.required);
          this.mappingForm.get('admittedByUserId')?.clearValidators();
        } else if (source === 'USER') {
          this.mappingForm.get('admittedByUserId')?.setValidators(Validators.required);
          this.mappingForm.get('consultancyId')?.clearValidators();
        }
        this.mappingForm.get('consultancyId')?.updateValueAndValidity();
        this.mappingForm.get('admittedByUserId')?.updateValueAndValidity();
      });
    } else {
      // For multi-selection types
      this.mappingForm = this.fb.group({
        // This will hold the IDs, but we'll primarily use selectedIds Set for UI
        selection: [[], Validators.required]
      });
    }
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
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
    this.updateFormValue();
  }

  selectAll(items: any[]): void {
    const allSelected = items.every(i => this.selectedIds.has(i.id));
    if (allSelected) {
      items.forEach(i => this.selectedIds.delete(i.id));
    } else {
      items.forEach(i => this.selectedIds.add(i.id));
    }
    this.updateFormValue();
  }

  private updateFormValue(): void {
    this.mappingForm.get('selection')?.setValue(Array.from(this.selectedIds));
    this.mappingForm.get('selection')?.updateValueAndValidity();
  }

  submitMapping(): void {
    if (this.mappingForm.invalid && this.data.type === 'students') return;
    if (this.selectedIds.size === 0 && this.data.type !== 'students') return;

    this.loading = true;
    const formValue = this.mappingForm.getRawValue();
    let obs$;

    const recordId = this.data.record.id || this.data.record.userId || this.data.record.consultancyId;

    switch (this.data.type) {
      case 'students':
        const studentPayload = { ...this.data.record, ...formValue };
        obs$ = this.studentService.updateAdmission(recordId, studentPayload);
        break;

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
      next: () => {
        this.toastr.success('Record mapped successfully');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Mapping failed');
        this.loading = false;
      }
    });
  }
}
