import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AdmissionPageData, AdmissionItem } from '../../core/models/admission.model';
import { AdmissionService } from '../../core/services/admission.service';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';

import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';
import { AdmissionFormModalComponent } from './components/admission-form-modal/admission-form-modal.component';

@Component({
  selector: 'app-admission-management',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    SidebarComponent, 
    TopbarComponent, 
    ConfirmationModalComponent,
    AdmissionFormModalComponent
  ],
  templateUrl: './admission-management.component.html',
  styleUrl: './admission-management.component.scss'
})
export class AdmissionManagementComponent implements OnInit {

  pageData: AdmissionPageData | null = null;
  searchTerm: string = '';
  loading: boolean = true;
  private sub: Subscription | null = null;
  private routeSub: Subscription | null = null;
  
  // Search state
  searchSubject = new Subject<string>();
  private searchSub: Subscription | null = null;

  // Filters & Sorting
  activeStatFilter: string = '';
  selectedCourseId: number | undefined = undefined;
  sortColumn: string = '';
  sortDirection: string = '';

  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;

  // Actions
  showDeleteModal: boolean = false;
  showAdmissionModal: boolean = false;
  selectedAdmission: AdmissionItem | null = null;
  selectedStudentId?: number;

  constructor(
    private admissionService: AdmissionService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Check URL for any pre-filled filters
    this.routeSub = this.route.queryParams.subscribe(params => {
      if (params['type']) {
        this.activeStatFilter = params['type'];
      }
      this.fetchData();
    });

    // Debounce search input
    this.searchSub = this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.currentPage = 1;
      this.fetchData();
    });
  }

  fetchData(): void {
    this.loading = true;
    this.sub = this.admissionService.getAdmissionsData(
      this.currentPage,
      this.pageSize,
      this.searchTerm,
      this.activeStatFilter,
      this.selectedCourseId,
      this.sortColumn,
      this.sortDirection
    ).subscribe(data => {
      this.pageData = data;
      this.totalPages = Math.ceil(data.totalCount / this.pageSize) || 1;
      this.loading = false;
      console.log('--- Admission Data Loaded ---', data);
    });
  }
  onView(id: number) {
    this.router.navigate(['/admissions', id]);
  }

  openAddAdmission(): void {
    this.selectedStudentId = undefined;
    this.showAdmissionModal = true;
  }

  onEdit(id: number) {
    this.selectedStudentId = id;
    this.showAdmissionModal = true;
  }

  closeAdmissionModal(): void {
    this.showAdmissionModal = false;
    this.selectedStudentId = undefined;
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
    this.searchSubject.next(this.searchTerm);
  }

  onPageSizeChange(): void {
    this.pageSize = Number(this.pageSize);
    this.currentPage = 1;
    this.fetchData();
  }

  onStatFilter(filter: string): void {
    if (this.activeStatFilter === filter) {
      this.activeStatFilter = ''; // toggle off
    } else {
      this.activeStatFilter = filter;
    }
    this.currentPage = 1;
    this.fetchData();
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      // Toggle direction
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.fetchData();
  }

  get paginatedAdmissions(): AdmissionItem[] {
    return this.pageData ? this.pageData.admissions : [];
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.fetchData();
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
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
    if (this.searchSub) {
      this.searchSub.unsubscribe();
    }
  }
}
