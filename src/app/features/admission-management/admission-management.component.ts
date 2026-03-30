import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AdmissionPageData, AdmissionItem } from '../../core/models/admission.model';
import { AdmissionService } from '../../core/services/admission.service';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';

import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-admission-management',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent, ConfirmationModalComponent],
  templateUrl: './admission-management.component.html',
  styleUrl: './admission-management.component.scss'
})
export class AdmissionManagementComponent implements OnInit {

  pageData: AdmissionPageData | null = null;
  filteredAdmissions: AdmissionItem[] = [];
  searchTerm: string = '';
  loading: boolean = true;
  private sub: Subscription | null = null;
  private routeSub: Subscription | null = null;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;

  // Actions
  showDeleteModal: boolean = false;
  selectedAdmission: AdmissionItem | null = null;

  constructor(
    private admissionService: AdmissionService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.loading = true;
    this.sub = this.admissionService.getAdmissionsData().subscribe(data => {
      this.pageData = data;
      this.filteredAdmissions = data.admissions;

      // Check URL for any pre-filled filters
      this.routeSub = this.route.queryParams.subscribe(params => {
        if (params['type']) {
          this.searchTerm = params['type'];
          this.onSearchChange();
        } else {
          // If no type parameter is present, show all admissions (no filter)
          this.searchTerm = '';
          this.filteredAdmissions = this.pageData ? this.pageData.admissions : [];
          this.calculatePagination();
        }
      });

      this.loading = false;
      console.log('--- Admission Data Loaded ---', data);
    });
  }
  onView(id: number) {
    this.router.navigate(['/admissions', id]);
  }

  onEdit(id: number) {
    this.router.navigate([], { fragment: 'edit' });
  }

  onDelete(admission: AdmissionItem) {
    this.selectedAdmission = admission;
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.selectedAdmission = null;
  }

  confirmDelete() {
    if (this.selectedAdmission && this.selectedAdmission.id) {
      this.loading = true;
      this.admissionService.deleteAdmission(this.selectedAdmission.id!).subscribe({
        next: () => {
          this.showDeleteModal = false;
          this.selectedAdmission = null;
          this.fetchData();
        },
        error: (err) => {
          console.error('Error deleting admission', err);
          this.loading = false;
          this.showDeleteModal = false;
        }
      });
    }
  }

  onSearchChange(): void {
    if (!this.pageData) return;

    if (this.searchTerm.trim() === '') {
      this.filteredAdmissions = this.pageData.admissions;
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredAdmissions = this.pageData.admissions.filter(item =>
        (item.fullName || '').toLowerCase().includes(term) ||
        (item.courseName || '').toLowerCase().includes(term) ||
        (item.feeStatus || '').toLowerCase().includes(term) ||
        (item.status || '').toLowerCase().includes(term)
      );
    }
    this.currentPage = 1; // reset page on search
    this.calculatePagination();
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredAdmissions.length / this.pageSize) || 1;
  }

  get paginatedAdmissions(): AdmissionItem[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredAdmissions.slice(startIndex, startIndex + this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPagesArray(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  toggleFeeStatus(item: AdmissionItem, newStatus: string): void {
    if (item.feeStatus === newStatus) return;

    // Optimistically update the UI
    const prevStatus = item.feeStatus;
    item.feeStatus = newStatus;

    // Persist to backend
    this.admissionService.updateFeeStatus(item.id, newStatus === 'Paid').subscribe({
      next: (res) => {
        // If the request fails or is null handled in service, we might want to revert:
        if (res === null) {
          item.feeStatus = prevStatus;
          console.warn('Backend update failed, reverting optimistic UI change.');
        } else {
          console.log(`Successfully updated fee status for student ${item.id} to ${newStatus}`);
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}
