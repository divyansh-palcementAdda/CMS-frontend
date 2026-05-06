import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { UnmappedService } from '../../core/services/unmapped.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { AdmissionService } from '../../core/services/admission.service';
import { UserService } from '../../core/services/user.service';
import { CourseService } from '../../core/services/course.service';
import { ConsultancyService } from '../../core/services/consultancy.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MappingModalComponent } from './mapping-modal/mapping-modal.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { FilterPipe } from '../../shared/pipes/filter.pipe';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-unmapped-records',
  standalone: true,
  imports: [
    TitleCasePipe,
    MatDialogModule,
    SidebarComponent,
    TopbarComponent,
    FormsModule,
    CommonModule
  ],
  templateUrl: './unmapped-records.component.html',
  styleUrls: ['./unmapped-records.component.scss']
})
export class UnmappedRecordsComponent implements OnInit {
  // Signals
  // Signals
  stats = signal<any>({});
  currentTab = signal<string>('students');
  data = signal<any[]>([]);
  loading = signal<boolean>(false);
  searchText = signal<string>('');

  // Pagination Signals
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  totalElements = signal<number>(0);

  tabs = [
    { id: 'students', label: 'Students', countKey: 'unmappedStudents' },
    { id: 'users', label: 'Users', countKey: 'usersWithoutConsultancy' },
    { id: 'courses', label: 'Courses', countKey: 'coursesWithoutConsultancy' },
    { id: 'consultancies-users', label: 'Consultancies (No Users)', countKey: 'consultanciesWithoutUsers' },
    { id: 'consultancies-courses', label: 'Consultancies (No Courses)', countKey: 'consultanciesWithoutCourses' }
  ];

  // Injections
  private unmappedService = inject(UnmappedService);
  private dashboardService = inject(DashboardService);
  private admissionService = inject(AdmissionService);
  private userService = inject(UserService);
  private courseService = inject(CourseService);
  private consultancyService = inject(ConsultancyService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private filterPipe = new FilterPipe();

  // Computed Values
  filteredData = computed(() => {
    // If backend handles search, this might just return data()
    // But we'll keep it for now as a fallback or if we want to filter on top of backend results
    return this.data();
  });

  paginatedData = computed(() => {
    // Since backend already paged the data, just return it
    return this.data();
  });

  totalPages = computed(() => {
    return Math.ceil(this.totalElements() / this.pageSize()) || 1;
  });

  ngOnInit(): void {
    this.loadStats();
    this.setTab('students');
  }

  loadStats(): void {
    this.dashboardService.getStats().subscribe({
      next: (res: any) => {
        this.stats.set(res);
      },
      error: (err: any) => console.error('Error loading stats', err)
    });
  }

  setTab(tabId: string): void {
    this.currentTab.set(tabId);
    this.currentPage.set(1); // Reset page
    this.loadData();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadData();
  }

  private searchTimeout: any;
  onSearchChange(text: string): void {
    this.searchText.set(text);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage.set(1);
      this.loadData();
    }, 500);
  }

  loadData(): void {
    this.loading.set(true);
    let obs$;
    const page = this.currentPage() - 1;
    const size = this.pageSize();
    const search = this.searchText();

    switch (this.currentTab()) {
      case 'students': obs$ = this.unmappedService.getUnmappedStudents(page, size, search); break;
      case 'users': obs$ = this.unmappedService.getUnmappedUsers(page, size, search); break;
      case 'courses': obs$ = this.unmappedService.getUnmappedCourses(page, size, search); break;
      case 'consultancies-users': obs$ = this.unmappedService.getConsultanciesWithoutUsers(page, size, search); break;
      case 'consultancies-courses': obs$ = this.unmappedService.getConsultanciesWithoutCourses(page, size, search); break;
    }

    obs$?.subscribe({
      next: (res: any) => {
        if (res && res.content) {
          this.data.set(res.content);
          this.totalElements.set(res.totalElements);
        } else {
          this.data.set([]);
          this.totalElements.set(0);
        }
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading unmapped data', err);
        this.loading.set(false);
      }
    });
  }

  // --- Record Actions (View/Delete) ---
  onViewRecord(item: any): void {
    const id = item.id || item.userId;
    if (!id) return;

    switch (this.currentTab()) {
      case 'students':
        this.router.navigate(['/admissions', id]);
        break;
      case 'users':
        this.router.navigate(['/users', id]);
        break;
      case 'courses':
        this.router.navigate(['/courses', id]);
        break;
      case 'consultancies-users':
      case 'consultancies-courses':
        this.router.navigate(['/consultancy', id]);
        break;
    }
  }

  onDeleteRecord(item: any): void {
    const id = item.id || item.userId;
    const name = item.fullName || item.name || 'this record';

    if (!id) return;

    if (confirm(`Are you sure you want to permanently delete "${name}"? This action cannot be undone.`)) {
      this.loading.set(true);
      let deleteObs$;

      switch (this.currentTab()) {
        case 'students': deleteObs$ = this.admissionService.deleteAdmission(id); break;
        case 'users': deleteObs$ = this.userService.deleteUser(id); break;
        case 'courses': deleteObs$ = this.courseService.deleteCourse(id); break;
        case 'consultancies-users':
        case 'consultancies-courses':
          deleteObs$ = this.consultancyService.deleteConsultancy(id);
          break;
      }

      deleteObs$?.subscribe({
        next: () => {
          this.loadData();
          this.loadStats();
          alert('Record deleted successfully');
        },
        error: (err: any) => {
          console.error('Error deleting record', err);
          this.loading.set(false);
          alert('Failed to delete record');
        }
      });
    }
  }

  // --- Pagination Logic ---
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadData();
    }
  }

  getPageNumbers(): (number | string)[] {
    const total = this.totalPages();
    const current = this.currentPage();

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
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
    return pages;
  }

  getRoleClass(roleInput: any): string {
    if (!roleInput) return 'user';

    let role = '';
    if (Array.isArray(roleInput)) {
      role = roleInput[0] || 'user';
    } else if (typeof roleInput === 'string') {
      role = roleInput.split(',')[0];
    } else {
      role = String(roleInput);
    }

    return role.trim().toLowerCase().replace(/\s+/g, '-');
  }

  openMappingModal(record: any): void {
    const dialogRef = this.dialog.open(MappingModalComponent, {
      width: '750px',
      maxWidth: '95vw',
      maxHeight: '95vh',
      backdropClass: 'blur-backdrop',
      disableClose: false,
      autoFocus: false,
      data: { type: this.currentTab(), record }
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.loadData();
        this.loadStats();
      }
    });
  }

  exportData(): void {
    const defaultCols = ['Name', 'Email', 'Mobile'];
    this.unmappedService.exportToExcel(this.currentTab(), defaultCols).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `unmapped_${this.currentTab()}.xlsx`;
        a.click();
      },
      error: (err: any) => console.error('Error exporting data', err)
    });
  }

  goBack(): void {
    window.history.back();
  }

  getAvatarColor(name: string): string {
    const colors = ['#435FFF', '#ec4899', '#f97316', '#10b981', '#06b6d4', '#eab308'];
    if (!name) return colors[0];
    const index = name.length % colors.length;
    return colors[index];
  }
}
