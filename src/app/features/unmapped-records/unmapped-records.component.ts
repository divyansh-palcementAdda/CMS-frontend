import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { UnmappedService } from '../../core/services/unmapped.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MappingModalComponent } from './mapping-modal/mapping-modal.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { FilterPipe } from '../../shared/pipes/filter.pipe';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-unmapped-records',
  standalone: true,
  imports: [
    TitleCasePipe,
    MatDialogModule,
    SidebarComponent,
    TopbarComponent,
    FilterPipe,
    FormsModule,
    CommonModule
  ],
  templateUrl: './unmapped-records.component.html',
  styleUrls: ['./unmapped-records.component.scss']
})
export class UnmappedRecordsComponent implements OnInit {
  stats = signal<any>({});
  currentTab = signal<string>('students');
  data = signal<any[]>([]);
  loading = signal<boolean>(false);
  searchText = signal<string>('');

  tabs = [
    { id: 'students', label: 'Students', countKey: 'unmappedStudents' },
    { id: 'users', label: 'Users', countKey: 'usersWithoutConsultancy' },
    { id: 'courses', label: 'Courses', countKey: 'coursesWithoutConsultancy' },
    { id: 'consultancies-users', label: 'Consultancies (No Users)', countKey: 'consultanciesWithoutUsers' },
    { id: 'consultancies-courses', label: 'Consultancies (No Courses)', countKey: 'consultanciesWithoutCourses' }
  ];

  private unmappedService = inject(UnmappedService);
  private dashboardService = inject(DashboardService);
  private dialog = inject(MatDialog);

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
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    let obs$;

    switch (this.currentTab()) {
      case 'students': obs$ = this.unmappedService.getUnmappedStudents(); break;
      case 'users': obs$ = this.unmappedService.getUnmappedUsers(); break;
      case 'courses': obs$ = this.unmappedService.getUnmappedCourses(); break;
      case 'consultancies-users': obs$ = this.unmappedService.getConsultanciesWithoutUsers(); break;
      case 'consultancies-courses': obs$ = this.unmappedService.getConsultanciesWithoutCourses(); break;
    }

    obs$?.subscribe({
      next: (res: any[]) => {
        this.data.set(res);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading unmapped data', err);
        this.loading.set(false);
      }
    });
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
