import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { UserService } from '../../core/services/user.service';
import { UserPageData, UserItem } from '../../core/models/user.model';

import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';
import { AddUserModalComponent } from './components/add-user-modal/add-user-modal.component';
import { BulkUploadModalComponent } from '../../shared/components/bulk-upload-modal/bulk-upload-modal.component';

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
  filteredUsers: UserItem[] = [];
  paginatedUsers: UserItem[] = [];
  searchTerm: string = '';

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  private sub!: Subscription;

  // Actions
  showAddModal = false;
  showDeleteModal = false;
  selectedUser: UserItem | null = null;
  showBulkUploadModal = false;

  // Filtering & Sorting
  currentFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'ADMIN' = 'ALL';
  sortOrder: 'asc' | 'desc' | 'none' = 'asc';

  constructor(
    public userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const status = params['status'];
      if (status) {
        this.fetchFilteredData(status);
      } else {
        this.fetchData();
      }
    });
  }

  fetchFilteredData(status: string | null) {
    this.loading = true;
    const filterStatus = status ? status.toUpperCase() : 'ALL';
    
    // Convert status to internal filter type
    if (filterStatus === 'ACTIVE') this.currentFilter = 'ACTIVE';
    else if (filterStatus === 'INACTIVE') this.currentFilter = 'INACTIVE';
    else this.currentFilter = 'ALL';

    this.sub = this.userService.getUsersData().subscribe(data => {
      this.pageData = data;
      this.applyFiltersAndSort();
      this.loading = false;
    });
  }
  onView(id: number) {
    this.router.navigate(['/users', id]);
  }

  onEdit(id: number) {
    this.selectedUser = this.pageData?.users.find(u => u.id === id) || null;
    this.showAddModal = true;
  }

  onAddUser() {
    this.selectedUser = null;
    this.showAddModal = true;
  }

  onAddSuccess() {
    this.fetchData();
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
    this.sub = this.userService.getUsersData().subscribe(data => {
      this.pageData = data;
      this.applyFiltersAndSort();
      this.loading = false;
    });
  }

  setFilter(filter: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'ADMIN') {
    this.currentFilter = filter;
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  toggleSort() {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.applyFiltersAndSort();
  }

  onSearchChange() {
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  applyFiltersAndSort() {
    if (!this.pageData) return;

    let users = [...this.pageData.users];

    // 1. Search Filter
    const term = this.searchTerm.toLowerCase().trim();
    if (term) {
      users = users.filter(u =>
        (u.fullName || '').toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term) ||
        (u.role || '').toLowerCase().includes(term)
      );
    }

    // 2. Status/Admin Filter
    if (this.currentFilter === 'ACTIVE') {
      users = users.filter(u => u.status === 'Active');
    } else if (this.currentFilter === 'INACTIVE') {
      users = users.filter(u => u.status === 'Inactive');
    } else if (this.currentFilter === 'ADMIN') {
      users = users.filter(u => 
        (u.role || '').toUpperCase().includes('ADMIN') || 
        u.roles?.some(r => r.name.toUpperCase().includes('ADMIN'))
      );
    }

    // 3. Sorting (Admins on top ALWAYS, then by name)
    users.sort((a, b) => {
      const aIsAdmin = (a.role || '').toUpperCase().includes('ADMIN') || a.roles?.some(r => r.name.toUpperCase().includes('ADMIN'));
      const bIsAdmin = (b.role || '').toUpperCase().includes('ADMIN') || b.roles?.some(r => r.name.toUpperCase().includes('ADMIN'));

      if (aIsAdmin && !bIsAdmin) return -1;
      if (!aIsAdmin && bIsAdmin) return 1;

      // Same category, sort by name
      const nameA = (a.fullName || '').toLowerCase();
      const nameB = (b.fullName || '').toLowerCase();
      
      if (this.sortOrder === 'asc') return nameA.localeCompare(nameB);
      if (this.sortOrder === 'desc') return nameB.localeCompare(nameA);
      return 0;
    });

    this.filteredUsers = users;
    this.calculatePagination();
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize) || 1;
    if (this.currentPage > this.totalPages) this.currentPage = 1;

    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.paginatedUsers = this.filteredUsers.slice(startIndex, startIndex + this.pageSize);
  }

  goToPage(page: number | string) {
    if (typeof page === 'number' && page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.calculatePagination();
    }
  }

  getPaginationRange(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const range: (number | string)[] = [];
    const delta = 1; // Number of pages around current

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
    // Use the first role for styling if there are multiple
    const firstRole = roleStr.split(',')[0].trim().toLowerCase();
    // Replace spaces with dashes
    return firstRole.replace(/\s+/g, '-');
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }
}
