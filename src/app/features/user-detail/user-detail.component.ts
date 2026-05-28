import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { StatePreservationService } from '../../core/services/state-preservation.service';
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
import { AddUserModalComponent } from '../user-management/components/add-user-modal/add-user-modal.component';
import { FeeStatusPipe, FeeStatusClassPipe } from '../../shared/pipes/fee-status.pipe';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, TopbarComponent, ConfirmationModalComponent, AddUserModalComponent, FeeStatusClassPipe],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss']
})
export class UserDetailComponent implements OnInit, OnDestroy {
  userId!: number;
  loading = true;
  user: UserItem | null = null;
  userDetail: UserDetail | null = null;
  showAddModal = false;
  // Categorized Student Lists
  totalApplications = signal<UserAdmissionDetail[]>([]);
  totalAdmissionsSignal = signal<UserAdmissionDetail[]>([]);
  cancelledApplications = signal<UserAdmissionDetail[]>([]);
  cancelledAdmissions = signal<UserAdmissionDetail[]>([]);
  masterList = signal<UserAdmissionDetail[]>([]); // All admissions + applications

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

  masterSearch = '';
  masterPage = 1;
  masterPageSize = 5;

  consPage = 1;
  consPageSize = 5;
  consSearch = '';

  // Sorting columns & directions
  totalAppSortBy = 'studentName';
  totalAppSortDir = 'asc';

  cancelledAppSortBy = 'studentName';
  cancelledAppSortDir = 'asc';

  totalAdmSortBy = 'studentName';
  totalAdmSortDir = 'asc';

  cancelledAdmSortBy = 'studentName';
  cancelledAdmSortDir = 'asc';

  masterSortBy = 'studentName';
  masterSortDir = 'asc';

  consSortBy = 'name';
  consSortDir = 'asc';

  private destroy$ = new Subject<void>();

  // Actions
  showDeleteModal = false;
  itemToDelete: any = null;
  deleteType: 'user' | 'consultancy' = 'user';
  exporting: { [key: string]: boolean } = {};

  // Filters
  consultancyStatusFilter: string | null = null;

  // Admission Filters
  admFilterSource: string | null = null;
  admFilterScholar: boolean | null = null;

  // Application Filters
  appFilterSource: string | null = null;
  appFilterScholar: boolean | null = null;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private userService: UserService,
    private consultancyService: ConsultancyService,
    private admissionService: AdmissionService,
    private location: Location,
    private statePreservationService: StatePreservationService
  ) { }

  ngOnInit() {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.userId = +idParam;
        this.restoreState();
        this.loadData();
      }
    });
  }

  saveState() {
    if (!this.userId) return;
    this.statePreservationService.saveState(`cms_user_detail_state_${this.userId}`, {
      totalAppSearch: this.totalAppSearch,
      totalAppPage: this.totalAppPage,
      totalAppPageSize: this.totalAppPageSize,

      cancelledAppSearch: this.cancelledAppSearch,
      cancelledAppPage: this.cancelledAppPage,
      cancelledAppPageSize: this.cancelledAppPageSize,

      totalAdmSearch: this.totalAdmSearch,
      totalAdmPage: this.totalAdmPage,
      totalAdmPageSize: this.totalAdmPageSize,

      cancelledAdmSearch: this.cancelledAdmSearch,
      cancelledAdmPage: this.cancelledAdmPage,
      cancelledAdmPageSize: this.cancelledAdmPageSize,

      masterSearch: this.masterSearch,
      masterPage: this.masterPage,
      masterPageSize: this.masterPageSize,

      consPage: this.consPage,
      consPageSize: this.consPageSize,
      consSearch: this.consSearch,

      consultancyStatusFilter: this.consultancyStatusFilter,
      admFilterSource: this.admFilterSource,
      admFilterScholar: this.admFilterScholar,
      appFilterSource: this.appFilterSource,
      appFilterScholar: this.appFilterScholar,

      // Sorting
      totalAppSortBy: this.totalAppSortBy,
      totalAppSortDir: this.totalAppSortDir,
      cancelledAppSortBy: this.cancelledAppSortBy,
      cancelledAppSortDir: this.cancelledAppSortDir,
      totalAdmSortBy: this.totalAdmSortBy,
      totalAdmSortDir: this.totalAdmSortDir,
      cancelledAdmSortBy: this.cancelledAdmSortBy,
      cancelledAdmSortDir: this.cancelledAdmSortDir,
      masterSortBy: this.masterSortBy,
      masterSortDir: this.masterSortDir,
      consSortBy: this.consSortBy,
      consSortDir: this.consSortDir
    });
  }

  restoreState() {
    if (!this.userId) return;
    const savedState = this.statePreservationService.getState<any>(`cms_user_detail_state_${this.userId}`);
    if (savedState) {
      this.totalAppSearch = savedState.totalAppSearch || '';
      this.totalAppPage = savedState.totalAppPage || 1;
      this.totalAppPageSize = savedState.totalAppPageSize || 5;

      this.cancelledAppSearch = savedState.cancelledAppSearch || '';
      this.cancelledAppPage = savedState.cancelledAppPage || 1;
      this.cancelledAppPageSize = savedState.cancelledAppPageSize || 5;

      this.totalAdmSearch = savedState.totalAdmSearch || '';
      this.totalAdmPage = savedState.totalAdmPage || 1;
      this.totalAdmPageSize = savedState.totalAdmPageSize || 5;

      this.cancelledAdmSearch = savedState.cancelledAdmSearch || '';
      this.cancelledAdmPage = savedState.cancelledAdmPage || 1;
      this.cancelledAdmPageSize = savedState.cancelledAdmPageSize || 5;

      this.masterSearch = savedState.masterSearch || '';
      this.masterPage = savedState.masterPage || 1;
      this.masterPageSize = savedState.masterPageSize || 5;

      this.consPage = savedState.consPage || 1;
      this.consPageSize = savedState.consPageSize || 5;
      this.consSearch = savedState.consSearch || '';

      this.consultancyStatusFilter = savedState.consultancyStatusFilter || null;
      this.admFilterSource = savedState.admFilterSource || null;
      this.admFilterScholar = savedState.admFilterScholar !== undefined ? savedState.admFilterScholar : null;
      this.appFilterSource = savedState.appFilterSource || null;
      this.appFilterScholar = savedState.appFilterScholar !== undefined ? savedState.appFilterScholar : null;

      this.totalAppSortBy = savedState.totalAppSortBy || 'studentName';
      this.totalAppSortDir = savedState.totalAppSortDir || 'asc';
      this.cancelledAppSortBy = savedState.cancelledAppSortBy || 'studentName';
      this.cancelledAppSortDir = savedState.cancelledAppSortDir || 'asc';
      this.totalAdmSortBy = savedState.totalAdmSortBy || 'studentName';
      this.totalAdmSortDir = savedState.totalAdmSortDir || 'asc';
      this.cancelledAdmSortBy = savedState.cancelledAdmSortBy || 'studentName';
      this.cancelledAdmSortDir = savedState.cancelledAdmSortDir || 'asc';
      this.masterSortBy = savedState.masterSortBy || 'studentName';
      this.masterSortDir = savedState.masterSortDir || 'asc';
      this.consSortBy = savedState.consSortBy || 'name';
      this.consSortDir = savedState.consSortDir || 'asc';
    }
  }

  loadData() {
    this.loading = true;
    this.userService.getUserDetail(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: UserDetail) => {
          this.userDetail = data;
          this.user = data.basicInfo;
          this.totalApplications.set(data.totalApplications || []);
          this.totalAdmissionsSignal.set(data.totalAdmissions || []);
          this.cancelledApplications.set(data.cancelledApplications || []);
          this.cancelledAdmissions.set(data.cancelledAdmissions || []);

          // Combine for master list
          const all = [
            ...(data.totalApplications || []),
            ...(data.totalAdmissions || []),
            ...(data.cancelledApplications || []),
            ...(data.cancelledAdmissions || [])
          ];
          this.masterList.set(all);

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

  // Generic sorting helper
  sortList(list: any[], sortBy: string, sortDir: string): any[] {
    return [...list].sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = String(valB).toLowerCase();
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Pagination & Filtering Getters
  get filteredTotalApplications() {
    const search = this.totalAppSearch.toLowerCase();
    const filtered = this.totalApplications().filter(item => {
      const matchesSearch = item.studentName.toLowerCase().includes(search) || item.courseName.toLowerCase().includes(search);

      const itemSource = (item.source || '').toLowerCase();
      const matchesSource = !this.appFilterSource || itemSource === this.appFilterSource.toLowerCase();

      const isScholarItem = item.isScholler === true || item.isScholler === 'true' || item.isScholler === 1 || item.isScholler === 'YES';
      const matchesScholar = this.appFilterScholar === null || (isScholarItem === this.appFilterScholar);

      // Strict fee check: Application must have totalFeesPaid == 0
      const matchesFee = (item.totalFeesPaid || 0) === 0;

      return matchesSearch && matchesSource && matchesScholar && matchesFee;
    });
    return this.sortList(filtered, this.totalAppSortBy, this.totalAppSortDir);
  }
  get paginatedTotalApplications() {
    const start = (this.totalAppPage - 1) * this.totalAppPageSize;
    return this.filteredTotalApplications.slice(start, start + this.totalAppPageSize);
  }

  get filteredCancelledApplications() {
    const search = this.cancelledAppSearch.toLowerCase();
    const filtered = this.cancelledApplications().filter(item =>
      item.studentName.toLowerCase().includes(search) ||
      item.courseName.toLowerCase().includes(search)
    );
    return this.sortList(filtered, this.cancelledAppSortBy, this.cancelledAppSortDir);
  }
  get paginatedCancelledApplications() {
    const start = (this.cancelledAppPage - 1) * this.cancelledAppPageSize;
    return this.filteredCancelledApplications.slice(start, start + this.cancelledAppPageSize);
  }

  get filteredTotalAdmissions() {
    const search = this.totalAdmSearch.toLowerCase();
    const filtered = this.totalAdmissionsSignal().filter(item => {
      const matchesSearch = item.studentName.toLowerCase().includes(search) || item.courseName.toLowerCase().includes(search);

      // Robust source matching
      const itemSource = (item.source || '').toLowerCase();
      const matchesSource = !this.admFilterSource || itemSource === this.admFilterSource.toLowerCase();

      // Robust scholar matching (handle boolean, string "true"/"false", or 1/0)
      const isScholarItem = item.isScholler === true || item.isScholler === 'true' || item.isScholler === 1 || item.isScholler === 'YES';
      const matchesScholar = this.admFilterScholar === null || (isScholarItem === this.admFilterScholar);

      // Strict fee check: Admission must have totalFeesPaid > 0
      const matchesFee = (item.totalFeesPaid || 0) > 0;

      return matchesSearch && matchesSource && matchesScholar && matchesFee;
    });
    return this.sortList(filtered, this.totalAdmSortBy, this.totalAdmSortDir);
  }
  get paginatedTotalAdmissions() {
    const start = (this.totalAdmPage - 1) * this.totalAdmPageSize;
    return this.filteredTotalAdmissions.slice(start, start + this.totalAdmPageSize);
  }

  get filteredCancelledAdmissions() {
    const search = this.cancelledAdmSearch.toLowerCase();
    const filtered = this.cancelledAdmissions().filter(item =>
      item.studentName.toLowerCase().includes(search) ||
      item.courseName.toLowerCase().includes(search)
    );
    return this.sortList(filtered, this.cancelledAdmSortBy, this.cancelledAdmSortDir);
  }
  get paginatedCancelledAdmissions() {
    const start = (this.cancelledAdmPage - 1) * this.cancelledAdmPageSize;
    return this.filteredCancelledAdmissions.slice(start, start + this.cancelledAdmPageSize);
  }

  get filteredMasterList() {
    const search = this.masterSearch.toLowerCase();
    const filtered = this.masterList().filter(item =>
      item.studentName.toLowerCase().includes(search) ||
      item.courseName.toLowerCase().includes(search)
    );
    return this.sortList(filtered, this.masterSortBy, this.masterSortDir);
  }
  get paginatedMasterList() {
    const start = (this.masterPage - 1) * this.masterPageSize;
    return this.filteredMasterList.slice(start, start + this.masterPageSize);
  }

  get paginatedConsultancies() {
    const start = (this.consPage - 1) * this.consPageSize;
    return this.filteredConsultancies.slice(start, start + this.consPageSize);
  }

  getTotalPages(count: number, size: number) {
    return Math.ceil(count / size) || 1;
  }

  changePage(type: string, delta: number) {
    if (type === 'totalApp') this.totalAppPage += delta;
    if (type === 'cancelledApp') this.cancelledAppPage += delta;
    if (type === 'totalAdm') this.totalAdmPage += delta;
    if (type === 'cancelledAdm') this.cancelledAdmPage += delta;
    if (type === 'master') this.masterPage += delta;
    if (type === 'cons') this.consPage += delta;
    this.saveState();
  }

  // Sorting handlers for each table
  sortTotalApp(col: string) {
    if (this.totalAppSortBy === col) {
      this.totalAppSortDir = this.totalAppSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.totalAppSortBy = col;
      this.totalAppSortDir = 'asc';
    }
    this.totalAppPage = 1;
    this.saveState();
  }

  sortCancelledApp(col: string) {
    if (this.cancelledAppSortBy === col) {
      this.cancelledAppSortDir = this.cancelledAppSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.cancelledAppSortBy = col;
      this.cancelledAppSortDir = 'asc';
    }
    this.cancelledAppPage = 1;
    this.saveState();
  }

  sortTotalAdm(col: string) {
    if (this.totalAdmSortBy === col) {
      this.totalAdmSortDir = this.totalAdmSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.totalAdmSortBy = col;
      this.totalAdmSortDir = 'asc';
    }
    this.totalAdmPage = 1;
    this.saveState();
  }

  sortCancelledAdm(col: string) {
    if (this.cancelledAdmSortBy === col) {
      this.cancelledAdmSortDir = this.cancelledAdmSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.cancelledAdmSortBy = col;
      this.cancelledAdmSortDir = 'asc';
    }
    this.cancelledAdmPage = 1;
    this.saveState();
  }

  sortMaster(col: string) {
    if (this.masterSortBy === col) {
      this.masterSortDir = this.masterSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.masterSortBy = col;
      this.masterSortDir = 'asc';
    }
    this.masterPage = 1;
    this.saveState();
  }

  sortCons(col: string) {
    if (this.consSortBy === col) {
      this.consSortDir = this.consSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.consSortBy = col;
      this.consSortDir = 'asc';
    }
    this.consPage = 1;
    this.saveState();
  }

  // Sort Icon Getters
  getTotalAppSortIcon(col: string) { return this.totalAppSortBy === col ? (this.totalAppSortDir === 'asc' ? 'bx-chevron-up' : 'bx-chevron-down') : 'bx-sort'; }
  getCancelledAppSortIcon(col: string) { return this.cancelledAppSortBy === col ? (this.cancelledAppSortDir === 'asc' ? 'bx-chevron-up' : 'bx-chevron-down') : 'bx-sort'; }
  getTotalAdmSortIcon(col: string) { return this.totalAdmSortBy === col ? (this.totalAdmSortDir === 'asc' ? 'bx-chevron-up' : 'bx-chevron-down') : 'bx-sort'; }
  getCancelledAdmSortIcon(col: string) { return this.cancelledAdmSortBy === col ? (this.cancelledAdmSortDir === 'asc' ? 'bx-chevron-up' : 'bx-chevron-down') : 'bx-sort'; }
  getMasterSortIcon(col: string) { return this.masterSortBy === col ? (this.masterSortDir === 'asc' ? 'bx-chevron-up' : 'bx-chevron-down') : 'bx-sort'; }
  getConsSortIcon(col: string) { return this.consSortBy === col ? (this.consSortDir === 'asc' ? 'bx-chevron-up' : 'bx-chevron-down') : 'bx-sort'; }

  getRoleClass(roleStr: string | undefined): string {
    if (!roleStr) return 'NA';
    // Use the first role for styling if there are multiple
    const firstRole = roleStr.split(',')[0].trim().toLowerCase();
    // Replace spaces with dashes
    return firstRole.replace(/\s+/g, '-');
  }
  get filteredConsultancies() {
    if (!this.user || !this.user.consultancies) return [];
    const search = this.consSearch.toLowerCase();
    const statusFiltered = !this.consultancyStatusFilter
      ? this.user.consultancies
      : this.user.consultancies.filter(c => c.status === this.consultancyStatusFilter);
    const searched = !search
      ? statusFiltered
      : statusFiltered.filter(c =>
          (c.name || '').toLowerCase().includes(search) ||
          (c.email || '').toLowerCase().includes(search) ||
          (c.city || '').toLowerCase().includes(search)
        );
    return this.sortList(searched, this.consSortBy, this.consSortDir);
  }

  // Interaction Handlers
  onAdmissionActivityClick(type: 'direct' | 'consultancy' | 'total') {
    // Legacy support, redirected to new premium tables
    if (type === 'total') this.scrollToTable('total-adms');
    else if (type === 'direct') this.scrollToTable('total-adms'); // Or perhaps applications
    else if (type === 'consultancy') this.scrollToTable('total-adms');
  }

  onStatClick(stat: string) {
    // Reset filters
    this.clearAdmissionFilter();
    this.clearApplicationFilter();
    this.clearConsultancyFilter();

    const statusMap: any = {
      active: 'ACTIVE',
      inactive: 'INACTIVE',
      dormant: 'DORMANT'
    };

    if (statusMap[stat] || stat === 'total_cons') {
      this.consultancyStatusFilter = statusMap[stat] || null;
      this.scrollToTable('consultancy-ownership');
    }
    else if (stat === 'total_all') {
      this.scrollToTable('master-table');
    }
    else if (stat === 'scholar_adm') {
      this.admFilterScholar = true;
      this.scrollToTable('total-adms');
    }
    else if (stat === 'direct_adm') {
      this.admFilterSource = 'USER';
      this.scrollToTable('total-adms');
    }
    else if (stat === 'cons_adm') {
      this.admFilterSource = 'CONSULTANCY';
      this.scrollToTable('total-adms');
    }
    else if (stat === 'scholar_app') {
      this.appFilterScholar = true;
      this.scrollToTable('total-apps');
    }
    else if (stat === 'direct_app') {
      this.appFilterSource = 'USER';
      this.scrollToTable('total-apps');
    }
    else if (stat === 'cons_app') {
      this.appFilterSource = 'CONSULTANCY';
      this.scrollToTable('total-apps');
    }
    this.saveState();
  }

  clearConsultancyFilter() {
    this.consultancyStatusFilter = null;
    this.saveState();
  }

  clearApplicationFilter() {
    this.appFilterSource = null;
    this.appFilterScholar = null;
    this.saveState();
  }

  clearAdmissionFilter() {
    this.admFilterSource = null;
    this.admFilterScholar = null;
    this.saveState();
  }

  onViewAdmission(id: number | undefined) {
    if (!id) return;
    this.router.navigate(['/admissions', id]);
  }

  onEditAdmission(id: number | undefined) {
    if (!id) return;
    this.router.navigate(['/admin/admission-management'], { fragment: 'edit', queryParams: { id } });
  }

  onDeleteAdmission(id: number | undefined) {
    if (!id) return;
    if (confirm('Are you sure you want to delete this admission?')) {
      this.admissionService.deleteAdmission(id).subscribe(() => this.loadData());
    }
  }

  onEdit() {
    this.showAddModal = true;
  }

  onDelete() {
    this.itemToDelete = this.user;
    this.deleteType = 'user';
    this.showDeleteModal = true;
  }

  onViewConsultancy(id: number | undefined) {
    if (!id) return;
    this.router.navigate(['/consultancy', id]);
  }

  onEditConsultancy(id: number | undefined) {
    if (!id) return;
    this.router.navigate(['/consultancy'], { fragment: 'edit', queryParams: { id } });
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
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/users']);
    }
  }

  downloadExcel(tab: string) {
    this.exporting[tab] = true;
    
    let search = '';
    let source = '';
    let scholar: boolean | null = null;
    
    if (tab === 'remaining_applications') {
      search = this.totalAppSearch;
      source = this.appFilterSource || '';
      scholar = this.appFilterScholar;
    } else if (tab === 'cancelled_applications') {
      search = this.cancelledAppSearch;
    } else if (tab === 'confirmed_admissions') {
      search = this.totalAdmSearch;
      source = this.admFilterSource || '';
      scholar = this.admFilterScholar;
    } else if (tab === 'cancelled_admissions') {
      search = this.cancelledAdmSearch;
    } else if (tab === 'total_applications') {
      search = this.masterSearch;
    }
    
    this.userService.exportUserStudents(this.userId, tab, search, source, scholar)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          this.exporting[tab] = false;
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          
          const now = new Date();
          const pad = (n: number) => n.toString().padStart(2, '0');
          const timestamp = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
          a.download = `user_${tab}_${timestamp}.xlsx`;
          
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          console.error('Failed to export Excel', err);
          this.exporting[tab] = false;
          alert('Failed to export Excel data. Please try again.');
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
