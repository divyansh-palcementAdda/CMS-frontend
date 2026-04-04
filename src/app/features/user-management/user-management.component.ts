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

  fetchFilteredData(status: string) {
    this.loading = true;
    this.sub = this.userService.getUsersByStatus(status).subscribe(data => {
      this.pageData = data;
      this.filteredUsers = data.users;
      this.calculatePagination();
      this.loading = false;
    });
  }
  onView(id: number) {
    this.router.navigate(['/users', id]);
  }

  onEdit(id: number) {
    this.router.navigate([], { fragment: 'edit' });
  }

  onAddUser() {
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
      this.filteredUsers = data.users;
      this.calculatePagination();
      this.loading = false;
    });
    console.log(this.pageData);
  }

  onSearchChange() {
    if (!this.pageData) return;
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredUsers = this.pageData.users;
    } else {
      this.filteredUsers = this.pageData.users.filter(u =>
        (u.fullName || '').toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term) ||
        ((u.role as string) || '').toLowerCase().includes(term)
      );
    }
    this.currentPage = 1;
    this.calculatePagination();
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize) || 1;
    if (this.currentPage > this.totalPages) this.currentPage = 1;

    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.paginatedUsers = this.filteredUsers.slice(startIndex, startIndex + this.pageSize);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.calculatePagination();
    }
  }

  getPagesArray(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  getRoleClass(roleStr: string | undefined): string {
    if (!roleStr) return 'student';
    // Use the first role for styling if there are multiple
    const firstRole = roleStr.split(',')[0].trim().toLowerCase();
    // Replace spaces with dashes
    return firstRole.replace(/\s+/g, '-');
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }
}
