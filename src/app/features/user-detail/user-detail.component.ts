import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { UserService } from '../../core/services/user.service';
import { UserDetail, UserAdmissionDetail, UserItem } from '../../core/models/user.model';
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
  userDetail: UserDetail | null = null;

  // Categorized Student Lists
  totalApplications = signal<UserAdmissionDetail[]>([]);
  totalAdmissionsSignal = signal<UserAdmissionDetail[]>([]); // Renamed to avoid numbering conflict
  cancelledApplications = signal<UserAdmissionDetail[]>([]);
  cancelledAdmissions = signal<UserAdmissionDetail[]>([]);

  // Search & Pagination States
  totalAppSearch = '';
  totalAppPage = 1;
  totalAppPageSize = 5;

  cancelledAppSearch = '';
  cancelledAppPage = 1;
  cancelledAppPageSize = 5;

  totalAdmSearch = '';
  totalAdmPage = 1;
  totalAdmPageSize = 5;

  cancelledAdmSearch = '';
  cancelledAdmPage = 1;
  cancelledAdmPageSize = 5;

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
    public router: Router,
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
    this.userService.getUserDetail(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: UserDetail) => {
          console.log("user detail data", data);
          this.userDetail = data;
          this.user = data.basicInfo;

          this.totalApplications.set(data.totalApplications || []);
          this.totalAdmissionsSignal.set(data.totalAdmissions || []);
          this.cancelledApplications.set(data.cancelledApplications || []);
          this.cancelledAdmissions.set(data.cancelledAdmissions || []);

          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading user details', err);
          this.loading = false;
        }
      });
  }

  // Helper for scrolling
  scrollToTable(id: string) {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Pagination & Filtering Getters
  get filteredTotalApplications() {
    const search = this.totalAppSearch.toLowerCase();
    return this.totalApplications().filter(item =>
      item.studentName.toLowerCase().includes(search) ||
      item.courseName.toLowerCase().includes(search)
    );
  }
  get paginatedTotalApplications() {
    const start = (this.totalAppPage - 1) * this.totalAppPageSize;
    return this.filteredTotalApplications.slice(start, start + this.totalAppPageSize);
  }

  get filteredCancelledApplications() {
    const search = this.cancelledAppSearch.toLowerCase();
    return this.cancelledApplications().filter(item =>
      item.studentName.toLowerCase().includes(search) ||
      item.courseName.toLowerCase().includes(search)
    );
  }
  get paginatedCancelledApplications() {
    const start = (this.cancelledAppPage - 1) * this.cancelledAppPageSize;
    return this.filteredCancelledApplications.slice(start, start + this.cancelledAppPageSize);
  }

  get filteredTotalAdmissions() {
    const search = this.totalAdmSearch.toLowerCase();
    return this.totalAdmissionsSignal().filter(item =>
      item.studentName.toLowerCase().includes(search) ||
      item.courseName.toLowerCase().includes(search)
    );
  }
  get paginatedTotalAdmissions() {
    const start = (this.totalAdmPage - 1) * this.totalAdmPageSize;
    return this.filteredTotalAdmissions.slice(start, start + this.totalAdmPageSize);
  }

  get filteredCancelledAdmissions() {
    const search = this.cancelledAdmSearch.toLowerCase();
    return this.cancelledAdmissions().filter(item =>
      item.studentName.toLowerCase().includes(search) ||
      item.courseName.toLowerCase().includes(search)
    );
  }
  get paginatedCancelledAdmissions() {
    const start = (this.cancelledAdmPage - 1) * this.cancelledAdmPageSize;
    return this.filteredCancelledAdmissions.slice(start, start + this.cancelledAdmPageSize);
  }

  getTotalPages(count: number, size: number) {
    return Math.ceil(count / size) || 1;
  }

  changePage(type: string, delta: number) {
    if (type === 'totalApp') this.totalAppPage += delta;
    if (type === 'cancelledApp') this.cancelledAppPage += delta;
    if (type === 'totalAdm') this.totalAdmPage += delta;
    if (type === 'cancelledAdm') this.cancelledAdmPage += delta;
  }

  get filteredConsultancies() {
    if (!this.user || !this.user.consultancies) return [];
    if (!this.consultancyStatusFilter) return this.user.consultancies;
    return this.user.consultancies.filter(c => c.status === this.consultancyStatusFilter);
  }

  // Interaction Handlers
  onAdmissionActivityClick(type: 'direct' | 'consultancy' | 'total') {
    // Legacy support, redirected to new premium tables
    if (type === 'total') this.scrollToTable('total-adms');
    else if (type === 'direct') this.scrollToTable('total-adms'); // Or perhaps applications
    else if (type === 'consultancy') this.scrollToTable('total-adms');
  }

  onStatClick(stat: string) {
    if (stat === 'active' || stat === 'inactive' || stat === 'dormant' || stat === 'total_cons') {
      const statusMap: any = { active: 'ACTIVE', inactive: 'INACTIVE', dormant: 'DORMANT' };
      this.consultancyStatusFilter = statusMap[stat] || null;
      this.scrollToTable('consultancy-ownership');
    } else if (stat === 'scholar') {
      this.scrollToTable('total-adms');
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
    if (confirm('Are you sure you want to delete this admission?')) {
      this.admissionService.deleteAdmission(id).subscribe(() => this.loadData());
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
