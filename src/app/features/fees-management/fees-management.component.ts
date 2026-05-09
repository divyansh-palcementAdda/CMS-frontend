import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { FeeService, FeeHistory, FeeStats, FeeFilterRequest } from '../../core/services/fee.service';
import { CourseService } from '../../core/services/course.service';
import { NotificationService } from '../../core/services/notification.service';
import { FeePaymentModalComponent } from '../admission-management/components/fee-payment-modal/fee-payment-modal.component';
import { LeadSourceService } from '../../core/services/lead-source.service';

import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { FilterDrawerComponent } from '../../shared/components/filter-drawer/filter-drawer.component';

@Component({
  selector: 'app-fees-management',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    RouterModule, 
    FeePaymentModalComponent,
    SidebarComponent,
    TopbarComponent,
    FilterDrawerComponent
  ],
  templateUrl: './fees-management.component.html',
  styleUrl: './fees-management.component.scss'
})
export class FeesManagementComponent implements OnInit, OnDestroy {
  // Stats
  stats: FeeStats | null = null;
  isLoadingStats = false;

  // History & Filters
  history: FeeHistory[] = [];
  isLoadingHistory = false;
  loading = false;
  totalElements = 0;
  totalPages = 0;
  currentPage: number = 1;
  pageSize: number = 10;
  
  filters: FeeFilterRequest = {
    page: 0,
    size: 10,
    sortColumn: 'id',
    sortDirection: 'desc',
    search: '',
    courseId: undefined,
    paymentMode: '',
    startDate: '',
    endDate: '',
    leadSourceId: undefined,
    statusFilter: ''
  };

  selectedDateRange: string = 'all'; // all, today, week, month, year, session, custom

  courses: any[] = [];
  leadSources: any[] = [];
  searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  get isFilterActive(): boolean {
    return !!(this.filters.courseId || this.filters.paymentMode || 
           this.filters.startDate || this.filters.endDate || 
           this.filters.search || this.filters.leadSourceId ||
           this.filters.statusFilter);
  }

  // Modal & Drawer State
  isModalVisible = false;
  isFilterDrawerOpen = false;
  selectedFee: FeeHistory | null = null;
  modalContext: any = null;

  protected readonly Math = Math;

  constructor(
    private feeService: FeeService,
    private courseService: CourseService,
    private leadSourceService: LeadSourceService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(val => {
      this.filters.search = val;
      this.currentPage = 1;
      this.loadHistory();
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.loadCourses();
    this.loadLeadSources();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStats(): void {
    this.feeService.getFeeStats(this.filters).subscribe({
      next: (res: FeeStats) => {
        this.stats = res;
      },
      error: (err) => console.error('Error loading fee stats', err)
    });
  }

  loadHistory(): void {
    this.loading = true;
    this.feeService.getFeeHistory(this.currentPage - 1, this.pageSize, this.filters).subscribe({
      next: (res: any) => {
        this.history = res.data?.content || res.content || [];
        this.totalElements = res.data?.totalElements || res.totalElements || 0;
        this.totalPages = res.data?.totalPages || res.totalPages || 0;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading fee history', err);
        this.loading = false;
      }
    });
  }

  loadCourses(): void {
    this.courseService.getAllCourses().subscribe((res: any[]) => {
      this.courses = res;
    });
  }

  loadData(): void {
    this.loadStats();
    this.loadHistory();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadHistory();
  }

  clearFilters(): void {
    this.filters = {
      page: 0,
      size: 10,
      sortColumn: 'id',
      sortDirection: 'desc',
      search: '',
      courseId: undefined,
      paymentMode: '',
      startDate: '',
      endDate: '',
      leadSourceId: undefined,
      session: undefined,
      statusFilter: ''
    };
    this.selectedDateRange = 'all';
    this.currentPage = 1;
    this.loadData();
    this.isFilterDrawerOpen = false;
  }

  onDateRangeChange(): void {
    const today = new Date();
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    switch (this.selectedDateRange) {
      case 'today':
        this.filters.startDate = formatDate(today);
        this.filters.endDate = formatDate(today);
        break;
      case 'week':
        const day = today.getDay(); // 0 is Sunday, 1 is Monday
        const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust to start of week (Monday)
        const startOfWeek = new Date(today.setDate(diff));
        this.filters.startDate = formatDate(startOfWeek);
        this.filters.endDate = formatDate(new Date());
        break;
      case 'month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        this.filters.startDate = formatDate(startOfMonth);
        this.filters.endDate = formatDate(new Date());
        break;
      case 'year':
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        this.filters.startDate = formatDate(startOfYear);
        this.filters.endDate = formatDate(new Date());
        break;
      case 'all':
        this.filters.startDate = '';
        this.filters.endDate = '';
        break;
      case 'custom':
        // Keep existing or let user pick
        break;
    }
    
    if (this.selectedDateRange !== 'custom') {
      this.loadData();
    }
  }

  toggleFilterDrawer(): void {
    this.isFilterDrawerOpen = !this.isFilterDrawerOpen;
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadData();
    this.isFilterDrawerOpen = false;
  }

  loadLeadSources(): void {
    this.leadSourceService.getActive().subscribe({
      next: (res: any) => {
        this.leadSources = res.data || res;
      },
      error: (err) => console.error('Error loading lead sources', err)
    });
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadHistory();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadHistory();
    }
  }

  getVisiblePages(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);

      if (current > 3) {
        pages.push('...');
      }

      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 2) {
        pages.push('...');
      }

      pages.push(total);
    }

    return pages;
  }

  viewStudent(fee: FeeHistory): void {
    this.router.navigate(['/admissions', fee.studentId], { 
      fragment: 'feeHistorySection',
      state: { from: 'fees-management' } 
    });
  }

  editFee(fee: FeeHistory): void {
    this.selectedFee = fee;
    this.isModalVisible = true;
  }

  async deleteFee(fee: FeeHistory) {
    const confirmed = await this.notificationService.confirm(
      'Delete Fee Entry',
      `Are you sure you want to delete this fee entry of ₹${fee.amountPaid} for ${fee.studentName}? This action cannot be undone and will affect the student's payment balance.`,
      'Delete',
      'Cancel'
    );

    if (confirmed) {
      this.feeService.deleteFee(fee.id).subscribe({
        next: () => {
          this.notificationService.success('Success', 'Fee transaction deleted successfully');
          this.loadData();
        },
        error: (err: any) => {
          console.error('Delete failed', err);
          this.notificationService.error('Error', 'Failed to delete transaction');
        }
      });
    }
  }

  onModalClose(): void {
    this.isModalVisible = false;
    this.selectedFee = null;
  }

  onFeeSaved(): void {
    this.loadHistory();
    this.loadStats();
    this.onModalClose();
  }
}
