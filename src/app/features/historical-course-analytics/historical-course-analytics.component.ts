import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { HistoricalAnalyticsService } from '../../core/services/historical-analytics.service';
import { CourseService } from '../../core/services/course.service';
import { ReportFilter } from '../../core/services/reports.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-historical-course-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent],
  templateUrl: './historical-course-analytics.component.html',
  styleUrls: ['./historical-course-analytics.component.scss']
})
export class HistoricalCourseAnalyticsComponent implements OnInit {
  private analyticsService = inject(HistoricalAnalyticsService);
  private courseService = inject(CourseService);

  // Lists
  records: any[] = [];
  coursesList: any[] = [];
  uniqueSessions: string[] = [];

  // Summary KPI values
  totalCourses = 0;
  totalForms = 0;
  totalFees = 0;
  totalEntries = 0;

  // Search Filters
  filter: ReportFilter = {
    page: 0,
    size: 10,
    session: 'OVERALL',
    search: '',
    filterType: 'ALL_TIME',
    startDate: '',
    endDate: '',
    sortBy: 'id',
    sortDir: 'desc'
  };

  // Pagination helper
  totalPages = 0;
  pagesArray: number[] = [];

  // Add/Edit Single Record
  showAddEditModal = false;
  editingId: number | null = null;
  formModel = {
    session: '',
    reportDate: '',
    courseId: '',
    formsCount: 0,
    feesCount: 0,
    remarks: ''
  };
  formError = '';

  // Bulk Upload variables
  showBulkUploadModal = false;
  uploadFile: File | null = null;
  uploadSession = '';
  uploadDataType = 'FORMS';
  uploadRemarks = '';
  uploadResult: any = null;
  uploadError = '';
  uploading = false;
  dragOver = false;

  apiUrl = environment.apiUrl;

  ngOnInit() {
    this.loadCourses();
    this.loadUniqueSessions();
    this.search();
  }

  loadCourses() {
    this.courseService.getAllCourses().subscribe({
      next: (res: any) => {
        this.coursesList = res || [];
      },
      error: (err) => console.error('Failed to load courses', err)
    });
  }

  loadUniqueSessions() {
    this.analyticsService.getUniqueSessions().subscribe({
      next: (res: any) => {
        this.uniqueSessions = res.data || [];
      },
      error: (err) => console.error('Failed to load sessions', err)
    });
  }

  search() {
    this.analyticsService.searchHistoricalAnalytics(this.filter).subscribe({
      next: (res: any) => {
        const pageData = res.data;
        if (pageData) {
          this.records = pageData.content || [];
          this.totalEntries = pageData.totalElements || 0;
          this.totalPages = pageData.totalPages || 0;
          this.pagesArray = Array.from({ length: this.totalPages }, (_, i) => i);
          
          this.calculateSummary();
        }
      },
      error: (err) => console.error('Failed to search records', err)
    });
  }

  calculateSummary() {
    // Dynamic KPI based on current filtered view
    const coursesSet = new Set<string>();
    let forms = 0;
    let fees = 0;

    this.records.forEach(r => {
      if (r.courseName) coursesSet.add(r.courseName);
      forms += r.formsCount || 0;
      fees += r.feesCount || 0;
    });

    this.totalCourses = coursesSet.size;
    this.totalForms = forms;
    this.totalFees = fees;
  }

  onSearchChange() {
    this.filter.page = 0;
    this.search();
  }

  changePage(p: number) {
    if (p >= 0 && p < this.totalPages) {
      this.filter.page = p;
      this.search();
    }
  }

  setSort(field: string) {
    if (this.filter.sortBy === field) {
      this.filter.sortDir = this.filter.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.filter.sortBy = field;
      this.filter.sortDir = 'desc';
    }
    this.filter.page = 0;
    this.search();
  }

  openAddModal() {
    this.editingId = null;
    this.formError = '';
    this.formModel = {
      session: '',
      reportDate: new Date().toISOString().substring(0, 10),
      courseId: '',
      formsCount: 0,
      feesCount: 0,
      remarks: ''
    };
    this.showAddEditModal = true;
  }

  openEditModal(record: any) {
    this.editingId = record.id;
    this.formError = '';
    this.formModel = {
      session: record.session,
      reportDate: record.reportDate,
      courseId: record.courseId ? record.courseId.toString() : '',
      formsCount: record.formsCount,
      feesCount: record.feesCount,
      remarks: record.remarks || ''
    };
    this.showAddEditModal = true;
  }

  saveRecord() {
    if (!this.formModel.session || !this.formModel.reportDate || !this.formModel.courseId) {
      this.formError = 'Please fill all required fields.';
      return;
    }

    const payload = {
      session: this.formModel.session,
      reportDate: this.formModel.reportDate,
      courseId: parseInt(this.formModel.courseId),
      formsCount: this.formModel.formsCount || 0,
      feesCount: this.formModel.feesCount || 0,
      remarks: this.formModel.remarks
    };

    const request$ = this.editingId 
      ? this.analyticsService.updateHistoricalAnalytics(this.editingId, payload)
      : this.analyticsService.createHistoricalAnalytics(payload);

    request$.subscribe({
      next: (res) => {
        this.showAddEditModal = false;
        this.search();
        this.loadUniqueSessions();
      },
      error: (err) => {
        this.formError = err.error?.message || 'Error occurred while saving record.';
      }
    });
  }

  deleteRecord(id: number) {
    if (confirm('Are you sure you want to delete this historical snapshot record?')) {
      this.analyticsService.deleteHistoricalAnalytics(id).subscribe({
        next: () => {
          this.search();
          this.loadUniqueSessions();
        },
        error: (err) => console.error('Failed to delete record', err)
      });
    }
  }

  downloadTemplate() {
    this.analyticsService.downloadTemplate().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'historical-course-snapshots-template.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Failed to download template', err)
    });
  }

  openBulkModal() {
    this.uploadError = '';
    this.uploadResult = null;
    this.uploadSession = '';
    this.uploadDataType = 'FORMS';
    this.uploadRemarks = '';
    this.uploadFile = null;
    this.showBulkUploadModal = true;
  }

  onFileChange(e: any) {
    const files = e.target.files;
    if (files.length > 0) {
      this.uploadFile = files[0];
    }
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(e: DragEvent) {
    e.preventDefault();
    this.dragOver = false;
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragOver = false;
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      this.uploadFile = files[0];
    }
  }

  triggerUpload() {
    if (!this.uploadFile) {
      this.uploadError = 'Please select a spreadsheet file first.';
      return;
    }
    if (!this.uploadSession) {
      this.uploadError = 'Session is required.';
      return;
    }

    this.uploading = true;
    this.uploadError = '';
    this.uploadResult = null;

    this.analyticsService.uploadExcel(
      this.uploadFile,
      this.uploadSession,
      this.uploadDataType,
      this.uploadRemarks
    ).subscribe({
      next: (res: any) => {
        this.uploading = false;
        this.uploadResult = res.data;
        if (this.uploadResult.failureCount === 0) {
          this.showBulkUploadModal = false;
          this.search();
          this.loadUniqueSessions();
        } else {
          this.search(); // load success rows anyway
          this.loadUniqueSessions();
        }
      },
      error: (err) => {
        this.uploading = false;
        this.uploadError = err.error?.message || 'Excel upload failed. Please verify format.';
      }
    });
  }

  downloadErrors(fileId: string) {
    window.open(`${this.apiUrl}/bulk-upload/errors/${fileId}`);
  }
}
