import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { UserService } from '../../core/services/user.service';
import { UserPageData, UserItem } from '../../core/models/user.model';

import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';
import { AddUserModalComponent } from './components/add-user-modal/add-user-modal.component';
import { BulkUploadModalComponent } from '../../shared/components/bulk-upload-modal/bulk-upload-modal.component';
import { StatePreservationService } from '../../core/services/state-preservation.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SidebarComponent, TopbarComponent, ConfirmationModalComponent, AddUserModalComponent, BulkUploadModalComponent],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss'
})

export class UserManagementComponent implements OnInit, OnDestroy {

  loading = true;
  pageData: UserPageData | null = null;
  paginatedUsers: UserItem[] = [];
  searchTerm: string = '';

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  private sub!: Subscription;
  private searchSubject = new Subject<string>();
  private searchSub!: Subscription;

  // Actions
  showAddModal = false;
  showDeleteModal = false;
  selectedUser: UserItem | null = null;
  showBulkUploadModal = false;

  // Filtering & Sorting
  currentFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'ADMIN' = 'ALL';
  sortBy: string = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    public userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private statePreservationService: StatePreservationService
  ) { }

  ngOnInit() {
    const savedState = this.statePreservationService.getState<any>('cms_user_management_state');
    if (savedState) {
      this.currentPage = savedState.currentPage || 1;
      this.pageSize = savedState.pageSize || 10;
      this.sortBy = savedState.sortBy || 'name';
      this.sortDirection = savedState.sortDirection || 'asc';
      this.searchTerm = savedState.searchTerm || '';
      this.currentFilter = savedState.currentFilter || 'ALL';
    }

    this.searchSub = this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 1;
      this.fetchData();
    });

    this.sub = this.route.queryParams.subscribe(params => {
      const status = params['status'];
      if (status) {
        this.fetchFilteredData(status);
      } else {
        this.fetchData();
      }

      // Handle route-triggered edit
      const editId = params['id'];
      if (editId && this.route.snapshot.fragment === 'edit') {
        this.onEdit(+editId);
      }
    });
  }

  fetchFilteredData(status: string | null) {
    const filterStatus = status ? status.toUpperCase() : 'ALL';
    
    if (filterStatus === 'ACTIVE') this.currentFilter = 'ACTIVE';
    else if (filterStatus === 'INACTIVE') this.currentFilter = 'INACTIVE';
    else this.currentFilter = 'ALL';

    this.currentPage = 1;
    this.fetchData();
  }

  onView(id: number) {
    this.router.navigate(['/users', id]);
  }

  onEdit(id: number) {
    this.loading = true;
    this.userService.getUserById(id).subscribe({
      next: (user) => {
        this.selectedUser = user;
        this.showAddModal = true;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching user for edit', err);
        this.loading = false;
      }
    });
  }

  onAddUser() {
    this.selectedUser = null;
    this.showAddModal = true;
  }

  onAddSuccess() {
    this.closeAddModal();
    this.fetchData();
  }

  closeAddModal() {
    const hasRouteTrigger = this.route.snapshot.fragment === 'edit' || !!this.route.snapshot.queryParams['id'];
    this.showAddModal = false;
    this.selectedUser = null;

    if (hasRouteTrigger) {
      this.location.back();
    }
  }

  onBulkUploadSuccess(result: any) {
    this.fetchData();
  }

  onDelete(user: UserItem) {
    this.selectedUser = user;
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.selectedUser = null;
  }

  confirmDelete() {
    if (this.selectedUser && this.selectedUser.id) {
      this.loading = true;
      this.userService.deleteUser(this.selectedUser.id).subscribe({
        next: () => {
          this.showDeleteModal = false;
          this.selectedUser = null;
          this.fetchData();
        },
        error: (err) => {
          console.error('Error deleting user', err);
          this.loading = false;
          this.showDeleteModal = false;
        }
      });
    }
  }

  fetchData() {
    this.loading = true;

    // Save state
    this.statePreservationService.saveState('cms_user_management_state', {
      currentPage: this.currentPage,
      pageSize: this.pageSize,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection,
      searchTerm: this.searchTerm,
      currentFilter: this.currentFilter
    });

    let statusParam = '';
    let roleParam   = '';
    if (this.currentFilter === 'ACTIVE')   statusParam = 'ACTIVE';
    else if (this.currentFilter === 'INACTIVE') statusParam = 'INACTIVE';
    else if (this.currentFilter === 'ADMIN')    roleParam   = 'ADMIN';

    // Single API call — stats and user list returned together
    this.sub = this.userService.getUsersPaged(
      this.currentPage - 1,
      this.pageSize,
      this.searchTerm,
      roleParam,
      statusParam,
      this.sortBy,
      this.sortDirection
    ).subscribe({
      next: (res) => {
        this.paginatedUsers = res.content;
        this.totalPages     = res.totalPages;
        this.pageData = {
          stats: res.stats,
          users: res.content,
          totalCount: res.totalElements
        };
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching paged users', err);
        this.loading = false;
      }
    });
  }

  setFilter(filter: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'ADMIN') {
    this.currentFilter = filter;
    this.currentPage = 1;
    this.fetchData();
  }

  toggleSort(column: string) {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.fetchData();
  }

  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }

  onPageSizeChange(newSize: number) {
    this.pageSize = newSize;
    this.currentPage = 1;
    this.fetchData();
  }

  goToPage(page: number | string) {
    if (typeof page === 'number' && page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.fetchData();
    }
  }

  getPaginationRange(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const range: (number | string)[] = [];
    const delta = 1;

    if (total <= 7) {
      for (let i = 1; i <= total; i++) range.push(i);
      return range;
    }

    range.push(1);
    if (current > delta + 2) range.push('...');

    const start = Math.max(2, current - delta);
    const end = Math.min(total - 1, current + delta);

    for (let i = start; i <= end; i++) range.push(i);

    if (current < total - delta - 1) range.push('...');
    range.push(total);

    return range;
  }

  getRoleClass(roleStr: string | undefined): string {
    if (!roleStr) return 'NA';
    const firstRole = roleStr.split(',')[0].trim().toLowerCase();
    return firstRole.replace(/\s+/g, '-');
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
    if (this.searchSub) this.searchSub.unsubscribe();
    // Clear preserved state so search/filters reset on next visit
    this.statePreservationService.clearState('cms_user_management_state');
  }
}
