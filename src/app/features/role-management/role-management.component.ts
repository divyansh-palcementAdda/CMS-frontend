import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { RoleService } from '../../core/services/role.service';
import { RolePageData, RoleItem } from '../../core/models/role.model';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent],
  templateUrl: './role-management.component.html',
  styleUrl: './role-management.component.scss'
})
export class RoleManagementComponent implements OnInit, OnDestroy {
  loading = true;
  pageData: RolePageData | null = null;
  filteredRoles: RoleItem[] = [];
  paginatedRoles: RoleItem[] = [];
  searchTerm: string = '';

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  private sub!: Subscription;

  constructor(private roleService: RoleService) { }

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.loading = true;
    this.sub = this.roleService.getRolesData().subscribe(data => {
      this.pageData = data;
      this.filteredRoles = data.roles;
      this.calculatePagination();
      this.loading = false;
    });
  }

  onSearchChange() {
    if (!this.pageData) return;
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredRoles = this.pageData.roles;
    } else {
      this.filteredRoles = this.pageData.roles.filter(role =>
        role.name.toLowerCase().includes(term) ||
        role.description.toLowerCase().includes(term)
      );
    }
    this.currentPage = 1;
    this.calculatePagination();
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.filteredRoles.length / this.pageSize) || 1;
    if (this.currentPage > this.totalPages) this.currentPage = 1;

    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.paginatedRoles = this.filteredRoles.slice(startIndex, startIndex + this.pageSize);
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

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }
}
