import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { UserService } from '../../core/services/user.service';
import { UserItem } from '../../core/models/user.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConsultancyService } from '../../core/services/consultancy.service';
import { AdmissionService } from '../../core/services/admission.service';
import { AdmissionItem } from '../../core/models/admission.model';

import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, TopbarComponent, ConfirmationModalComponent],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss']
})
export class UserDetailComponent implements OnInit, OnDestroy {
  userId!: number;
  loading = true;
  user: UserItem | null = null;

  // Admissions Data for tables
  directAdmissions: AdmissionItem[] = [];
  consultancyAdmissions: AdmissionItem[] = [];
  totalAdmissions: AdmissionItem[] = [];

  private destroy$ = new Subject<void>();

  // Actions
  showDeleteModal = false;
  itemToDelete: any = null;
  deleteType: 'user' | 'consultancy' = 'user';

  // Filters
  consultancyStatusFilter: string | null = null;
  admissionScholarFilter: boolean | null = null;
  admissionNoConsultancyFilter: boolean | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private consultancyService: ConsultancyService,
    private admissionService: AdmissionService
  ) { }

  ngOnInit() {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.userId = +idParam;
        this.loadData();
      }
    });
  }

  loadData() {
    this.loading = true;
    this.userService.getUserById(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log("user data", data);
          this.user = data;
          this.loadAdmissions();
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading user details', err);
          this.loading = false;
        }
      });
  }

  loadAdmissions() {
    // 1. Load Direct Admissions
    this.admissionService.getStudentsByFilter('USER', undefined, this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.directAdmissions = data.admissions);

    // 2. Load Consultancy Admissions
    this.admissionService.getStudentsByFilter('CONSULTANCY', undefined, this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.consultancyAdmissions = data.admissions);

    // 3. Load Total Admissions (only by this user)
    this.admissionService.getStudentsByFilter(undefined, undefined, this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.totalAdmissions = data.admissions);
  }

  // Getters for filtered data
  get filteredConsultancies() {
    if (!this.user || !this.user.consultancies) return [];
    if (!this.consultancyStatusFilter) return this.user.consultancies;
    return this.user.consultancies.filter(c => c.status === this.consultancyStatusFilter);
  }

  get filteredTotalAdmissions() {
    let admissions = this.totalAdmissions;
    if (this.admissionScholarFilter !== null) {
      admissions = admissions.filter(a => a.isScholar === this.admissionScholarFilter);
    }
    if (this.admissionNoConsultancyFilter) {
      admissions = admissions.filter(a => !a.consultancyId);
    }
    return admissions;
  }

  // Interaction Handlers
  onAdmissionActivityClick(type: 'direct' | 'consultancy' | 'total') {
    const elementId = type === 'direct' ? 'direct-admissions' :
      type === 'consultancy' ? 'consultancy-admissions' :
        'total-admissions';

    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onStatClick(stat: string) {
    if (stat === 'active' || stat === 'inactive' || stat === 'dormant' || stat === 'total_cons') {
      const statusMap: any = { active: 'ACTIVE', inactive: 'INACTIVE', dormant: 'DORMANT' };
      this.consultancyStatusFilter = statusMap[stat] || null;

      const element = document.getElementById('consultancy-ownership');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (stat === 'scholar') {
      this.admissionScholarFilter = true;
      this.admissionNoConsultancyFilter = false;

      const element = document.getElementById('total-admissions');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    else if (stat === 'coursesWithoutConsultancy') {
      this.admissionNoConsultancyFilter = true;
      this.admissionScholarFilter = null;

      const element = document.getElementById('total-admissions');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  clearConsultancyFilter() {
    this.consultancyStatusFilter = null;
  }

  clearAdmissionFilter() {
    this.admissionScholarFilter = null;
    this.admissionNoConsultancyFilter = false;
  }

  onViewAdmission(id: number | undefined) {
    if (!id) return;
    this.router.navigate(['/admission-management', id]);
  }

  onEditAdmission(id: number | undefined) {
    if (!id) return;
    this.router.navigate(['/admission-management'], { fragment: 'edit', queryParams: { id } });
  }

  onDeleteAdmission(id: number | undefined) {
    if (!id) return;
    // Basic implementation for now
    if (confirm('Are you sure you want to delete this admission?')) {
      this.admissionService.deleteAdmission(id).subscribe(() => this.loadAdmissions());
    }
  }

  onEdit() {
    this.router.navigate([], { fragment: 'edit' });
  }

  onDelete() {
    this.itemToDelete = this.user;
    this.deleteType = 'user';
    this.showDeleteModal = true;
  }

  onViewConsultancy(id: number | undefined) {
    if (!id) return;
    this.router.navigate(['/consultancy-management', id]);
  }

  onEditConsultancy(id: number | undefined) {
    if (!id) return;
    this.router.navigate(['/consultancy-management'], { fragment: 'edit' });
  }

  onDeleteConsultancy(consultancy: any) {
    this.itemToDelete = consultancy;
    this.deleteType = 'consultancy';
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.itemToDelete = null;
    this.showDeleteModal = false;
  }

  confirmDelete() {
    if (!this.itemToDelete) return;
    this.loading = true;
    let deleteObservable;

    if (this.deleteType === 'user') {
      deleteObservable = this.userService.deleteUser(this.userId);
    } else if (this.deleteType === 'consultancy') {
      deleteObservable = this.consultancyService.deleteConsultancy(this.itemToDelete.id);
    } else {
      this.loading = false;
      this.showDeleteModal = false;
      return;
    }

    deleteObservable.subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.itemToDelete = null;
        if (this.deleteType === 'user') {
          this.router.navigate(['/users']);
        } else {
          this.loadData();
        }
      },
      error: (err) => {
        console.error(`Error deleting ${this.deleteType}`, err);
        this.loading = false;
        this.showDeleteModal = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/users']);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
