import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { ConsultancyService } from '../../../core/services/consultancy.service';
import { CourseService } from '../../../core/services/course.service';
import { UserService } from '../../../core/services/user.service';
import { AdmissionService } from '../../../core/services/admission.service';
import { InstitutionService } from '../../../core/services/institution.service';

export type MappingType = 'students' | 'users' | 'courses' | 'consultancies-users' | 'consultancies-courses';

interface ModalConfig { title: string; subtitle: string; icon: string; color: string; gradient: string; }

@Component({
  selector: 'app-mapping-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './mapping-modal.component.html',
  styleUrls: ['./mapping-modal.component.scss']
})
export class MappingModalComponent implements OnInit {
  mappingForm!: FormGroup;

  // ── Dropdown data ──────────────────────────────────────────────────────────
  consultancies: any[] = [];
  users: any[] = [];
  courses: any[] = [];
  institutions: any[] = [];

  // ── Live search signals ────────────────────────────────────────────────────
  userSearch    = signal<string>('');
  conSearch     = signal<string>('');
  courseSearch  = signal<string>('');
  instSearch    = signal<string>('');

  // ── Multi-select sets ──────────────────────────────────────────────────────
  selectedConsultancyIds  = new Set<number>();
  selectedUserIds         = new Set<number>();
  selectedCourseIds       = new Set<number>();
  selectedInstitutionIds  = new Set<number>();
  availableConsultancyIds = new Set<number>(); // rep-filtered

  // ── Bidirectional relationship maps (consultancies-courses only) ───────────
  // courseInstitutionMap: courseId → Set of institutionIds that offer it
  // institutionCourseMap: institutionId → Set of courseIds it offers
  courseInstitutionMap = new Map<number, Set<number>>();
  institutionCourseMap = new Map<number, Set<number>>();
  relationshipLoading  = false; // tracks the in-progress institution→courses calls

  // ── UI state ───────────────────────────────────────────────────────────────
  loading        = false;
  dropdownLoading = false;
  currentStep    = 1;   // 1 = mapping, 2 = fees (students only)
  showConfirm    = false;

  private toastr = inject(ToastrService);

  // ── Config map ─────────────────────────────────────────────────────────────
  readonly modalConfig: Record<MappingType, ModalConfig> = {
    students: {
      title: 'Map Student', subtitle: 'Assign admission source & representative',
      icon: 'school', color: '#435FFF', gradient: 'linear-gradient(135deg, #435FFF, #7c94ff)'
    },
    users: {
      title: 'Map User', subtitle: 'Link user to one or more consultancies',
      icon: 'person_pin', color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #34d399)'
    },
    courses: {
      title: 'Map Course', subtitle: 'Assign course to one or more consultancies',
      icon: 'menu_book', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)'
    },
    'consultancies-users': {
      title: 'Map Consultancy → Users', subtitle: 'Link representatives to this consultancy',
      icon: 'business', color: '#ec4899', gradient: 'linear-gradient(135deg, #ec4899, #f472b6)'
    },
    'consultancies-courses': {
      title: 'Map Consultancy → Courses', subtitle: 'Assign courses & institutions to this consultancy',
      icon: 'handshake', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)'
    }
  };

  paymentModes = [
    { value: 'CASH',          label: '💵  Cash' },
    { value: 'UPI',           label: '📱  UPI / QR Code' },
    { value: 'BANK_TRANSFER', label: '🏦  Bank Transfer' },
    { value: 'CARD',          label: '💳  Credit / Debit Card' },
    { value: 'CHEQUE',        label: '📄  Cheque' }
  ];

  constructor(
    public dialogRef: MatDialogRef<MappingModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { type: MappingType; record: any },
    private fb: FormBuilder,
    private consultancyService: ConsultancyService,
    private userService: UserService,
    private studentService: AdmissionService,
    private courseService: CourseService,
    private institutionService: InstitutionService
  ) {}

  // ── Convenience getters ────────────────────────────────────────────────────
  get type(): MappingType  { return this.data.type; }
  get record(): any        { return this.data.record; }
  get config(): ModalConfig { return this.modalConfig[this.type]; }
  get isStudents(): boolean          { return this.type === 'students'; }
  get isUsers(): boolean             { return this.type === 'users'; }
  get isCourses(): boolean           { return this.type === 'courses'; }
  get isConsultanciesUsers(): boolean  { return this.type === 'consultancies-users'; }
  get isConsultanciesCourses(): boolean { return this.type === 'consultancies-courses'; }
  get recordName(): string  { return this.record?.fullName || this.record?.name || 'Record'; }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.initForm();
    this.loadDropdowns();
  }

  // ── Form Initialisation ────────────────────────────────────────────────────
  initForm(): void {
    if (this.isStudents) {
      this.mappingForm = this.fb.group({
        admissionSource:   ['CONSULTANCY', Validators.required],
        admittedByUserId:  [null, Validators.required],
        consultancyId:     [null, Validators.required],
        isScholar:         [false],
        discountType:      [null],
        discountValue:     [0, [Validators.min(0)]],
        scholarshipDetails:[''],
        feeAmount:         [null],
        paymentMode:       ['CASH'],
        referenceNo:       [''],
        remarks:           ['']
      });

      this.mappingForm.get('admissionSource')?.valueChanges.subscribe(src => {
        this.resetStudentSelections();
        const cc = this.mappingForm.get('consultancyId');
        if (src === 'CONSULTANCY') { cc?.setValidators(Validators.required); }
        else                       { cc?.clearValidators(); cc?.setValue(null); }
        cc?.updateValueAndValidity();
      });

      this.mappingForm.get('isScholar')?.valueChanges.subscribe(on => {
        if (on) this.mappingForm.patchValue({ discountType: null, discountValue: 0, scholarshipDetails: 'Scholarship Applied' }, { emitEvent: false });
      });

      this.mappingForm.get('discountType')?.valueChanges.subscribe(() => this.updateDiscountValidators());
      this.updateDiscountValidators();
    } else {
      this.mappingForm = this.fb.group({});
    }
  }

  resetStudentSelections(): void {
    this.availableConsultancyIds.clear();
    this.mappingForm.patchValue({ admittedByUserId: null, consultancyId: null }, { emitEvent: false });
  }

  private updateDiscountValidators(): void {
    const type = this.mappingForm.get('discountType')?.value;
    const ctrl = this.mappingForm.get('discountValue');
    if (!ctrl) return;
    const max = type === 'PERCENTAGE' ? 100 : (this.record?.totalCourseFees || 999999);
    ctrl.setValidators([Validators.min(0), Validators.max(max)]);
    ctrl.updateValueAndValidity();
  }

  get discountError(): string | null {
    const ctrl = this.mappingForm.get('discountValue');
    if (ctrl?.errors?.['max']) {
      const t = this.mappingForm.get('discountType')?.value;
      return t === 'PERCENTAGE' ? 'Cannot exceed 100%' : `Cannot exceed ₹${this.record?.totalCourseFees || 'Total'}`;
    }
    return null;
  }

  // ── Data Loading ───────────────────────────────────────────────────────────
  loadDropdowns(): void {
    this.dropdownLoading = true;

    if (this.isStudents || this.isConsultanciesUsers) {
      this.userService.getUsersByStatus('ACTIVE').subscribe(res => {
        this.users = (res.users || res as any) ?? [];
        this.dropdownLoading = false;
      });
    }

    if (this.isStudents || this.isUsers || this.isCourses) {
      this.consultancyService.getConsultancyData().subscribe(res => {
        this.consultancies = res.consultancies ?? [];
        this.dropdownLoading = false;
      });
    }

    if (this.isConsultanciesCourses) {
      this.loadConsultancyCourseData();
    }

    // consultancies-users: only users needed (loaded above)
    if (this.isConsultanciesUsers) { /* already handled */ }
  }

  /**
   * Loads all courses + institutions, then fires per-institution course-list
   * calls in parallel to build the bidirectional courseInstitutionMap /
   * institutionCourseMap used for dynamic filtering.
   */
  private loadConsultancyCourseData(): void {
    this.dropdownLoading   = true;
    this.relationshipLoading = true;
    this.courseInstitutionMap.clear();
    this.institutionCourseMap.clear();

    forkJoin({
      courses:      this.courseService.getAllCourses(),
      institutions: this.institutionService.getInstitutionsData()
    }).pipe(
      switchMap(({ courses, institutions }) => {
        this.courses      = courses ?? [];
        this.institutions = institutions.institutions ?? [];
        this.dropdownLoading = false;

        // Seed maps from any relationships embedded in the raw course objects
        // (backend may include course.institutions: [{id}]).  This is free.
        this.seedMapsFromCourses(courses);

        const instIds = this.institutions.map(i => i.id).filter(Boolean);
        if (instIds.length === 0) return of([] as { institutionId: number; courses: any[] }[]);

        // Fire one call per institution in parallel; suppress individual errors
        return forkJoin(
          instIds.map(id =>
            this.institutionService.getInstitutionCourses(id).pipe(
              catchError(() => of([] as any[]))
            ).pipe(
              switchMap(courseList => of({ institutionId: id, courses: courseList }))
            )
          )
        );
      }),
      catchError(() => of([] as any[]))
    ).subscribe({
      next: (rels: any) => {
        if (Array.isArray(rels)) {
          rels.forEach(({ institutionId, courses }: { institutionId: number; courses: any[] }) => {
            if (!this.institutionCourseMap.has(institutionId)) {
              this.institutionCourseMap.set(institutionId, new Set());
            }
            (courses || []).forEach((course: any) => {
              const cId: number = course.id;
              if (!cId) return;
              // institution → course
              this.institutionCourseMap.get(institutionId)!.add(cId);
              // course → institution (reverse)
              if (!this.courseInstitutionMap.has(cId)) {
                this.courseInstitutionMap.set(cId, new Set());
              }
              this.courseInstitutionMap.get(cId)!.add(institutionId);
            });
          });
        }
        this.relationshipLoading = false;
      },
      error: () => { this.relationshipLoading = false; }
    });
  }

  /**
   * Seed the maps from any institution list embedded inside the raw course
   * objects themselves (e.g. course.institutions = [{id, name}]).  This avoids
   * extra API calls when the backend already sends the relationship.
   */
  private seedMapsFromCourses(courses: any[]): void {
    courses.forEach(course => {
      const cId: number = course.id;
      if (!cId) return;
      if (!this.courseInstitutionMap.has(cId)) {
        this.courseInstitutionMap.set(cId, new Set());
      }
      const embedded: any[] = course.institutions || course.institutionList || [];
      embedded.forEach((inst: any) => {
        const iId: number = inst.id || inst;
        if (typeof iId !== 'number') return;
        this.courseInstitutionMap.get(cId)!.add(iId);
        if (!this.institutionCourseMap.has(iId)) {
          this.institutionCourseMap.set(iId, new Set());
        }
        this.institutionCourseMap.get(iId)!.add(cId);
      });
    });
  }

  // ── Filtered Lists ─────────────────────────────────────────────────────────
  get filteredUsers(): any[] {
    const t = this.userSearch().toLowerCase();
    return this.users.filter(u =>
      !t || u.fullName?.toLowerCase().includes(t) ||
      u.username?.toLowerCase().includes(t) || u.email?.toLowerCase().includes(t)
    );
  }

  get filteredConsultancies(): any[] {
    const t    = this.conSearch().toLowerCase();
    const src  = this.mappingForm.get('admissionSource')?.value;
    const repId = this.mappingForm.get('admittedByUserId')?.value;

    return this.consultancies.filter(c => {
      const ok = !t || c.name?.toLowerCase().includes(t) || c.email?.toLowerCase().includes(t);
      if (this.isStudents) {
        if (src === 'USER') return false;
        if (src === 'CONSULTANCY' && repId) return ok && this.availableConsultancyIds.has(c.id);
      }
      return ok;
    });
  }

  get filteredCourses(): any[] {
    const t = this.courseSearch().toLowerCase();
    let list = this.courses;

    // ── Bidirectional: if institution(s) selected, show only courses they offer
    if (this.isConsultanciesCourses && this.selectedInstitutionIds.size > 0) {
      list = list.filter(course => {
        const linked = this.courseInstitutionMap.get(course.id);
        if (!linked || linked.size === 0) {
          // No relationship data yet — show tentatively so user isn't locked out
          return this.relationshipLoading;
        }
        return Array.from(this.selectedInstitutionIds).some(iId => linked.has(iId));
      });
    }

    return list.filter(c =>
      !t || c.name?.toLowerCase().includes(t) || c.courseTypeName?.toLowerCase().includes(t)
    );
  }

  get filteredInstitutions(): any[] {
    const t = this.instSearch().toLowerCase();
    let list = this.institutions;

    // ── Bidirectional: if course(s) selected, show only institutions that offer them
    if (this.isConsultanciesCourses && this.selectedCourseIds.size > 0) {
      list = list.filter(inst => {
        const linked = this.institutionCourseMap.get(inst.id);
        if (!linked || linked.size === 0) {
          return this.relationshipLoading;
        }
        return Array.from(this.selectedCourseIds).some(cId => linked.has(cId));
      });
    }

    return list.filter(i =>
      !t || i.name?.toLowerCase().includes(t) || i.code?.toLowerCase().includes(t)
    );
  }

  // ── Filter-status helpers (used by template for UX indicators) ─────────────
  get coursesFilteredByInst(): boolean {
    return this.isConsultanciesCourses && this.selectedInstitutionIds.size > 0;
  }
  get institutionsFilteredByCourse(): boolean {
    return this.isConsultanciesCourses && this.selectedCourseIds.size > 0;
  }

  // ── Student-specific selection ─────────────────────────────────────────────
  selectRepresentative(userId: number): void {
    const cur = this.mappingForm.get('admittedByUserId')?.value;
    if (cur === userId) {
      this.mappingForm.patchValue({ admittedByUserId: null, consultancyId: null });
      this.availableConsultancyIds.clear();
      return;
    }
    this.mappingForm.patchValue({ admittedByUserId: userId, consultancyId: null });
    this.availableConsultancyIds.clear();
    this.userService.getUserById(userId).subscribe(user => {
      if (user.consultancies?.length) {
        user.consultancies.forEach((c: any) => this.availableConsultancyIds.add(c.id));
        if (user.consultancies.length === 1) {
          this.mappingForm.patchValue({ consultancyId: user.consultancies[0].id });
        }
      }
    });
  }

  selectConsultancyForStudent(cId: number): void {
    const cur = this.mappingForm.get('consultancyId')?.value;
    this.mappingForm.patchValue({ consultancyId: cur === cId ? null : cId });
  }

  // ── Multi-select toggles ───────────────────────────────────────────────────
  toggleConsultancy(id: number): void  { this._toggle(this.selectedConsultancyIds, id); }
  toggleUser(id: number): void         { this._toggle(this.selectedUserIds, id); }
  toggleCourse(id: number): void       { this._toggle(this.selectedCourseIds, id); }
  toggleInstitution(id: number): void  { this._toggle(this.selectedInstitutionIds, id); }

  private _toggle(set: Set<number>, id: number): void {
    set.has(id) ? set.delete(id) : set.add(id);
  }

  isConSelected(id: number): boolean   { return this.selectedConsultancyIds.has(id); }
  isUserSelected(id: number): boolean  { return this.selectedUserIds.has(id); }
  isCourseSelected(id: number): boolean { return this.selectedCourseIds.has(id); }
  isInstSelected(id: number): boolean  { return this.selectedInstitutionIds.has(id); }

  selectAllConsultancies(): void { this._selectAll(this.filteredConsultancies, this.selectedConsultancyIds); }
  selectAllUsers(): void         { this._selectAll(this.filteredUsers, this.selectedUserIds); }
  selectAllCourses(): void       { this._selectAll(this.filteredCourses, this.selectedCourseIds); }

  private _selectAll(items: any[], set: Set<number>): void {
    const all = items.every(i => set.has(i.id));
    items.forEach(i => all ? set.delete(i.id) : set.add(i.id));
  }

  removeConsultancy(id: number): void  { this.selectedConsultancyIds.delete(id); }
  removeUser(id: number): void         { this.selectedUserIds.delete(id); }
  removeCourse(id: number): void       { this.selectedCourseIds.delete(id); }
  removeInstitution(id: number): void  { this.selectedInstitutionIds.delete(id); }

  // ── Array snapshots for @for change-detection ──────────────────────────────
  // Angular's @for needs an Array (or any Iterable snapshot) to re-render
  // correctly when the underlying Set mutates within Zone.js event handlers.
  get selectedConsultancyArray(): number[] { return Array.from(this.selectedConsultancyIds); }
  get selectedUserArray(): number[]        { return Array.from(this.selectedUserIds); }
  get selectedCourseArray(): number[]      { return Array.from(this.selectedCourseIds); }
  get selectedInstitutionArray(): number[] { return Array.from(this.selectedInstitutionIds); }

  // ── Name helpers ───────────────────────────────────────────────────────────
  getConName(id: number): string  { return this.consultancies.find(c => c.id === id)?.name  || '—'; }
  getUserName(id: number): string {
    const u = this.users.find(u => u.id === id);
    return u?.fullName || u?.username || '—';
  }
  getCourseName(id: number): string { return this.courses.find(c => c.id === id)?.name || '—'; }
  getInstName(id: number): string  { return this.institutions.find(i => i.id === id)?.name || '—'; }

  // ── Step / Flow Navigation ─────────────────────────────────────────────────
  get canProceed(): boolean {
    if (this.isStudents) {
      const src = this.mappingForm.get('admissionSource')?.value;
      const rep = this.mappingForm.get('admittedByUserId')?.value;
      const con = this.mappingForm.get('consultancyId')?.value;
      if (!src || !rep) return false;
      if (src === 'CONSULTANCY' && !con) return false;
      return true;
    }
    if (this.isUsers || this.isCourses)        return this.selectedConsultancyIds.size > 0;
    if (this.isConsultanciesUsers)              return this.selectedUserIds.size > 0;
    if (this.isConsultanciesCourses)            return this.selectedCourseIds.size > 0;
    return false;
  }

  advanceStep(): void {
    if (!this.canProceed) {
      this.mappingForm.markAllAsTouched();
      this.toastr.warning('Please complete all required selections before continuing.');
      return;
    }
    if (this.isStudents) {
      if (this.mappingForm.get('isScholar')?.value || this.currentStep === 2) {
        this.showConfirm = true;
      } else {
        this.currentStep = 2;
      }
    } else {
      this.showConfirm = true;
    }
  }

  goBack(): void {
    if (this.showConfirm) { this.showConfirm = false; return; }
    if (this.currentStep > 1) this.currentStep--;
  }

  skipFees(): void { this.showConfirm = true; }

  // ── Confirmation Summary ───────────────────────────────────────────────────
  get summaryItems(): { label: string; value: string; icon: string }[] {
    const items: { label: string; value: string; icon: string }[] = [];
    if (this.isStudents) {
      const fv = this.mappingForm.getRawValue();
      items.push({ label: 'Student',        value: this.recordName,                                          icon: 'person' });
      items.push({ label: 'Channel',        value: fv.admissionSource === 'CONSULTANCY' ? 'Consultancy' : 'Internal', icon: 'swap_horiz' });
      items.push({ label: 'Representative', value: this.getUserName(fv.admittedByUserId),                   icon: 'badge' });
      if (fv.admissionSource === 'CONSULTANCY' && fv.consultancyId) {
        items.push({ label: 'Consultancy',  value: this.getConName(fv.consultancyId),                       icon: 'apartment' });
      }
      items.push({ label: 'Scholar Status', value: fv.isScholar ? '✓ Yes — Scholarship Applied' : 'No',   icon: 'school' });
      if (!fv.isScholar && fv.discountType) {
        items.push({ label: 'Discount',     value: `${fv.discountValue} ${fv.discountType === 'PERCENTAGE' ? '%' : '₹ (Flat)'}`, icon: 'sell' });
      }
      if (fv.feeAmount && fv.feeAmount > 0) {
        items.push({ label: 'Fee Paid',     value: `₹${fv.feeAmount} via ${fv.paymentMode}`,               icon: 'payments' });
      }
    } else if (this.isUsers) {
      items.push({ label: 'User',           value: this.recordName,                                          icon: 'person' });
      items.push({ label: 'Consultancies',  value: Array.from(this.selectedConsultancyIds).map(id => this.getConName(id)).join(', '), icon: 'apartment' });
    } else if (this.isCourses) {
      items.push({ label: 'Course',         value: this.recordName,                                          icon: 'menu_book' });
      items.push({ label: 'Consultancies',  value: Array.from(this.selectedConsultancyIds).map(id => this.getConName(id)).join(', '), icon: 'apartment' });
    } else if (this.isConsultanciesUsers) {
      items.push({ label: 'Consultancy',    value: this.recordName,                                          icon: 'apartment' });
      items.push({ label: 'Users',          value: Array.from(this.selectedUserIds).map(id => this.getUserName(id)).join(', '),        icon: 'group' });
    } else if (this.isConsultanciesCourses) {
      items.push({ label: 'Consultancy',    value: this.recordName,                                          icon: 'apartment' });
      items.push({ label: 'Courses',        value: Array.from(this.selectedCourseIds).map(id => this.getCourseName(id)).join(', '),    icon: 'menu_book' });
      if (this.selectedInstitutionIds.size > 0) {
        items.push({ label: 'Institutions', value: Array.from(this.selectedInstitutionIds).map(id => this.getInstName(id)).join(', '), icon: 'account_balance' });
      }
    }
    return items;
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  submitMapping(): void {
    this.loading = true;
    const id = this.record.id || this.record.userId || this.record.consultancyId;

    switch (this.type) {
      case 'students':            this.doStudentMap(id);           break;
      case 'users':               this.doUserMap(id);              break;
      case 'courses':             this.doCourseMap(id);            break;
      case 'consultancies-users': this.doConsultancyUsersMap(id);  break;
      case 'consultancies-courses': this.doConsultancyCoursesMap(id); break;
    }
  }

  private doStudentMap(studentId: any): void {
    const fv = this.mappingForm.getRawValue();
    this.studentService.updateAdmission(studentId, { ...this.record, ...fv, id: studentId }).subscribe({
      next: () => {
        if (fv.feeAmount && fv.feeAmount > 0) {
          this.studentService.addFeePayment(studentId, {
            studentId, amount: fv.feeAmount, paymentMode: fv.paymentMode,
            referenceNo: fv.referenceNo, remarks: fv.remarks
          }).subscribe({ next: () => this.onSuccess(), error: e => this.onError(e) });
        } else {
          this.onSuccess();
        }
      },
      error: e => this.onError(e)
    });
  }

  private doUserMap(userId: any): void {
    const rec = this.record;
    let roles = ['USER'];
    if (Array.isArray(rec.roles)) roles = rec.roles.map((r: any) => typeof r === 'string' ? r : (r.name || 'USER'));
    else if (rec.role) roles = rec.role.split(',').map((r: string) => `ROLE_${r.trim().toUpperCase().replace(/\s+/g, '_')}`);
    this.userService.updateUser(userId, { ...rec, roles, consultancyIds: Array.from(this.selectedConsultancyIds), password: rec.password || '' })
      .subscribe({ next: () => this.onSuccess(), error: e => this.onError(e) });
  }

  private doCourseMap(courseId: any): void {
    this.courseService.updateCourse(courseId, { ...this.record, consultancyIds: Array.from(this.selectedConsultancyIds) })
      .subscribe({ next: () => this.onSuccess(), error: e => this.onError(e) });
  }

  private doConsultancyUsersMap(consultancyId: any): void {
    this.consultancyService.updateConsultancy(consultancyId, { ...this.record, representativeIds: Array.from(this.selectedUserIds) })
      .subscribe({ next: () => this.onSuccess(), error: e => this.onError(e) });
  }

  private doConsultancyCoursesMap(consultancyId: any): void {
    this.consultancyService.updateConsultancy(consultancyId, {
      ...this.record,
      courseIds:       Array.from(this.selectedCourseIds),
      institutionIds:  Array.from(this.selectedInstitutionIds)
    }).subscribe({ next: () => this.onSuccess(), error: e => this.onError(e) });
  }

  private onSuccess(): void {
    this.toastr.success('Record mapped successfully!', '✓ Mapping Complete');
    this.dialogRef.close(true);
  }

  private onError(err: any): void {
    this.loading = false;
    const status = err?.status;
    let msg = 'Something went wrong. Please try again.';
    if      (status === 400) msg = err.error?.message || 'Invalid data. Please review your selections.';
    else if (status === 404) msg = 'Record not found — it may have been deleted.';
    else if (status === 500) msg = 'Server error. Contact support if this persists.';
    else if (err.error?.message) msg = err.error.message;
    this.toastr.error(msg, 'Mapping Failed');
  }
}
