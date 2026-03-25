import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { UserService } from '../../core/services/user.service';
import { UserPageData, UserItem } from '../../core/models/user.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SidebarComponent, TopbarComponent],
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

  constructor(private userService: UserService) { }

  ngOnInit() {
    this.fetchData();
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
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.role.toLowerCase().includes(term)
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

  getRoleClass(roleStr: string): string {
    if (!roleStr) return '';
    // Use the first role for styling if there are multiple
    const firstRole = roleStr.split(',')[0].trim().toLowerCase();
    // Replace spaces with dashes
    return firstRole.replace(/\s+/g, '-');
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }
}
