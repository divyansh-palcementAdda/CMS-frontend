import { Component, OnInit, OnDestroy, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule, ChartComponent } from "ng-apexcharts";
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { CourseService } from '../../core/services/course.service';
import { AdmissionService } from '../../core/services/admission.service';
import { InstitutionService } from '../../core/services/institution.service';
import { CourseDetail } from '../../core/models/course.model';
import { FeeStatusPipe, FeeStatusClassPipe } from '../../shared/pipes/fee-status.pipe';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';
import { StudentAnalyticsModalComponent } from '../../shared/components/student-analytics-modal/student-analytics-modal.component';
import { DownloadConfirmationModalComponent } from '../../shared/components/download-confirmation-modal/download-confirmation-modal.component';

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexYAxis,
  ApexTitleSubtitle,
  ApexLegend,
  ApexFill,
  ApexPlotOptions,
  ApexTooltip,
  ApexGrid
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
  tooltip: ApexTooltip;
  colors: string[];
  grid: ApexGrid;
  title: ApexTitleSubtitle;
  legend: ApexLegend;
};

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, NgApexchartsModule, SidebarComponent, TopbarComponent, FormsModule, ConfirmationModalComponent, FeeStatusClassPipe, StudentAnalyticsModalComponent, DownloadConfirmationModalComponent],
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.scss']
})
export class CourseDetailComponent implements OnInit, OnDestroy {
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions!: Partial<ChartOptions>;

  courseId!: number;
  courseDetail: CourseDetail | null = null;
  loading = true;

  private destroy$ = new Subject<void>();

  // Paginated Signals
  masterList = signal<any[]>([]);
  totalApplications = signal<any[]>([]);
  cancelledApplications = signal<any[]>([]);
  totalAdmissions = signal<any[]>([]);
  cancelledAdmissions = signal<any[]>([]);
  consultanciesList = signal<any[]>([]);
  institutionsList = signal<any[]>([]);
  userBreakdownList = signal<any[]>([]);

  // Modal Control
  showAnalyticsModal = false;
  modalUserId = 0;
  modalUserName = '';
  modalInitialTab = 'ALL_APPLICATIONS';
  modalCity = '';
  modalState = '';

  // Outer Table Breakdown Pagination
  breakdownPage = 1;
  breakdownPageSize = 10;
  breakdownTotal = 0;
  breakdownSortBy = 'userName';
  breakdownSortDir = 'asc';
  selectedSession = '';

  // Search & Pagination States
  masterSearch = '';
  masterPage = 1;
  masterPageSize = 10;
  masterTotal = 0;
  masterSortBy = 'date';
  masterSortDir = 'desc';

  totalAppSearch = '';
  totalAppPage = 1;
  totalAppPageSize = 10;
  totalAppTotal = 0;
  totalAppSortBy = 'date';
  totalAppSortDir = 'desc';

  cancelledAppSearch = '';
  cancelledAppPage = 1;
  cancelledAppPageSize = 10;
  cancelledAppTotal = 0;
  cancelledAppSortBy = 'date';
  cancelledAppSortDir = 'desc';

  totalAdmSearch = '';
  totalAdmPage = 1;
  totalAdmPageSize = 10;
  totalAdmTotal = 0;
  totalAdmSortBy = 'date';
  totalAdmSortDir = 'desc';

  cancelledAdmSearch = '';
  cancelledAdmPage = 1;
  cancelledAdmPageSize = 10;
  cancelledAdmTotal = 0;
  cancelledAdmSortBy = 'date';
  cancelledAdmSortDir = 'desc';

  consSearch = '';
  consPage = 1;
  consPageSize = 10;
  consTotal = 0;
  consSortBy = 'name';
  consSortDir = 'asc';

  instSearch = '';
  instPage = 1;
  instPageSize = 10;
  instTotal = 0;
  instSortBy = 'name';
  instSortDir = 'asc';

  // Filters
  appFilterSource: string | null = null;
  appFilterScholar: boolean | null = null;
  admFilterSource: string | null = null;
  admFilterScholar: boolean | null = null;
  consultancyStatusFilter: string = '';

  // Actions
  showDeleteModal = false;
  deleteType: string = '';
  itemToDelete: any = null;
  exporting: { [key: string]: boolean } = {};

  // Breakdown Download Modal
  showBreakdownDownloadModal = false;
  breakdownDownloading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private admissionService: AdmissionService,
    private institutionService: InstitutionService
  ) {
    this.initChart();
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.courseId = +idParam;
        this.loadCourseDetail();
      }
    });

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['showAnalyticsModal'] === 'true') {
        this.modalUserId = Number(params['modalUserId'] || 0);
        this.modalUserName = params['modalUserName'] || '';
        this.modalInitialTab = params['modalInitialTab'] || 'ALL_APPLICATIONS';
        this.showAnalyticsModal = true;
      } else {
        this.showAnalyticsModal = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCourseDetail(): void {
    this.loading = true;
    this.courseService.getCourseDetail(this.courseId, this.selectedSession || undefined).subscribe({
      next: (data) => {
        this.courseDetail = data;
        this.updateChartData();

        // Fetch all paginated data
        this.loadCourseUserBreakdown();
        this.fetchCourseStudents('remaining_applications');
        this.fetchCourseStudents('cancelled_applications');
        this.fetchCourseStudents('confirmed_admissions');
        this.fetchCourseStudents('cancelled_admissions');
        this.fetchCourseConsultancies();
        this.fetchCourseInstitutions();

        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading course detail:', err);
        this.loading = false;
      }
    });
  }

  fetchCourseStudents(tab: string): void {
    let page, size, search, source, scholar, sortBy, sortDir;
    switch (tab) {
      case 'remaining_applications':
        page = this.totalAppPage - 1; size = this.totalAppPageSize; search = this.totalAppSearch; source = this.appFilterSource; scholar = this.appFilterScholar; sortBy = this.totalAppSortBy; sortDir = this.totalAppSortDir;
        break;
      case 'master_remaining':
        page = this.masterPage - 1; size = this.masterPageSize; search = this.masterSearch; source = null; scholar = null; sortBy = this.masterSortBy; sortDir = this.masterSortDir;
        break;
      case 'cancelled_applications':
        page = this.cancelledAppPage - 1; size = this.cancelledAppPageSize; search = this.cancelledAppSearch; source = null; scholar = null; sortBy = this.cancelledAppSortBy; sortDir = this.cancelledAppSortDir;
        break;
      case 'confirmed_admissions':
        page = this.totalAdmPage - 1; size = this.totalAdmPageSize; search = this.totalAdmSearch; source = this.admFilterSource; scholar = this.admFilterScholar; sortBy = this.totalAdmSortBy; sortDir = this.totalAdmSortDir;
        break;
      case 'cancelled_admissions':
        page = this.cancelledAdmPage - 1; size = this.cancelledAdmPageSize; search = this.cancelledAdmSearch; source = null; scholar = null; sortBy = this.cancelledAdmSortBy; sortDir = this.cancelledAdmSortDir;
        break;
      default: return;
    }

    const apiTab = tab === 'master_remaining' ? 'remaining_applications' : tab;
    this.courseService.getCourseStudentsPaged(this.courseId, page, size, apiTab, search, source || '', scholar, sortBy, sortDir)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const content = res.content || [];
          const total = res.totalElements || 0;
          switch (tab) {
            case 'remaining_applications': this.totalApplications.set(content); this.totalAppTotal = total; break;
            case 'master_remaining': this.masterList.set(content); this.masterTotal = total; break;
            case 'cancelled_applications': this.cancelledApplications.set(content); this.cancelledAppTotal = total; break;
            case 'confirmed_admissions': this.totalAdmissions.set(content); this.totalAdmTotal = total; break;
            case 'cancelled_admissions': this.cancelledAdmissions.set(content); this.cancelledAdmTotal = total; break;
          }
        },
        error: (err) => console.error(`Error fetching students for tab ${tab}:`, err)
      });
  }

  fetchCourseConsultancies(): void {
    this.courseService.getCourseConsultanciesPaged(this.courseId, this.consPage - 1, this.consPageSize, this.consSearch, this.consSortBy, this.consSortDir)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.consultanciesList.set(res.content || []);
          this.consTotal = res.totalElements || 0;
        },
        error: (err) => console.error('Error fetching course consultancies:', err)
      });
  }

  fetchCourseInstitutions(): void {
    this.courseService.getCourseInstitutionsPaged(this.courseId, this.instPage - 1, this.instPageSize, this.instSearch, this.instSortBy, this.instSortDir)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.institutionsList.set(res.content || []);
          this.instTotal = res.totalElements || 0;
        },
        error: (err) => console.error('Error fetching course institutions:', err)
      });
  }

  // --- Sorting Handlers ---
  sortMaster(col: string) {
    if (this.masterSortBy === col) {
      this.masterSortDir = this.masterSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.masterSortBy = col;
      this.masterSortDir = 'asc';
    }
    this.fetchCourseStudents('remaining_applications');
  }

  sortTotalApp(col: string) {
    if (this.totalAppSortBy === col) {
      this.totalAppSortDir = this.totalAppSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.totalAppSortBy = col;
      this.totalAppSortDir = 'asc';
    }
    this.fetchCourseStudents('remaining_applications');
  }

  sortCancelledApp(col: string) {
    if (this.cancelledAppSortBy === col) {
      this.cancelledAppSortDir = this.cancelledAppSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.cancelledAppSortBy = col;
      this.cancelledAppSortDir = 'asc';
    }
    this.fetchCourseStudents('cancelled_applications');
  }

  sortTotalAdm(col: string) {
    if (this.totalAdmSortBy === col) {
      this.totalAdmSortDir = this.totalAdmSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.totalAdmSortBy = col;
      this.totalAdmSortDir = 'asc';
    }
    this.fetchCourseStudents('confirmed_admissions');
  }

  sortCancelledAdm(col: string) {
    if (this.cancelledAdmSortBy === col) {
      this.cancelledAdmSortDir = this.cancelledAdmSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.cancelledAdmSortBy = col;
      this.cancelledAdmSortDir = 'asc';
    }
    this.fetchCourseStudents('cancelled_admissions');
  }

  sortCons(col: string) {
    if (this.consSortBy === col) {
      this.consSortDir = this.consSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.consSortBy = col;
      this.consSortDir = 'asc';
    }
    this.fetchCourseConsultancies();
  }

  sortInst(col: string) {
    if (this.instSortBy === col) {
      this.instSortDir = this.instSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.instSortBy = col;
      this.instSortDir = 'asc';
    }
    this.fetchCourseInstitutions();
  }

  sortBreakdown(col: string) {
    if (this.breakdownSortBy === col) {
      this.breakdownSortDir = this.breakdownSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.breakdownSortBy = col;
      this.breakdownSortDir = 'asc';
    }
    this.breakdownPage = 1;
    this.loadCourseUserBreakdown();
  }

  // --- Getters for Sorting Icons ---
  getMasterSortIcon(col: string) { return this.masterSortBy === col ? (this.masterSortDir === 'asc' ? 'bx-chevron-up' : 'bx-chevron-down') : 'bx-sort'; }
  getTotalAppSortIcon(col: string) { return this.totalAppSortBy === col ? (this.totalAppSortDir === 'asc' ? 'bx-chevron-up' : 'bx-chevron-down') : 'bx-sort'; }
  getCancelledAppSortIcon(col: string) { return this.cancelledAppSortBy === col ? (this.cancelledAppSortDir === 'asc' ? 'bx-chevron-up' : 'bx-chevron-down') : 'bx-sort'; }
  getTotalAdmSortIcon(col: string) { return this.totalAdmSortBy === col ? (this.totalAdmSortDir === 'asc' ? 'bx-chevron-up' : 'bx-chevron-down') : 'bx-sort'; }
  getCancelledAdmSortIcon(col: string) { return this.cancelledAdmSortBy === col ? (this.cancelledAdmSortDir === 'asc' ? 'bx-chevron-up' : 'bx-chevron-down') : 'bx-sort'; }
  getConsSortIcon(col: string) { return this.consSortBy === col ? (this.consSortDir === 'asc' ? 'bx-chevron-up' : 'bx-chevron-down') : 'bx-sort'; }
  getInstSortIcon(col: string) { return this.instSortBy === col ? (this.instSortDir === 'asc' ? 'bx-chevron-up' : 'bx-chevron-down') : 'bx-sort'; }
  getBreakdownSortIcon(col: string) { return this.breakdownSortBy === col ? (this.breakdownSortDir === 'asc' ? 'bx-chevron-up' : 'bx-chevron-down') : 'bx-sort'; }

  // --- Export Excel ---
  exportExcel(tab: string) {
    this.exporting[tab] = true;
    let search = '';
    let source = '';
    let scholar: boolean | null = null;

    if (tab === 'remaining_applications') {
      search = this.totalAppSearch; source = this.appFilterSource || ''; scholar = this.appFilterScholar;
    } else if (tab === 'confirmed_admissions') {
      search = this.totalAdmSearch; source = this.admFilterSource || ''; scholar = this.admFilterScholar;
    } else if (tab === 'remaining_applications') {
      search = this.masterSearch;
    } else if (tab === 'cancelled_applications') {
      search = this.cancelledAppSearch;
    } else if (tab === 'cancelled_admissions') {
      search = this.cancelledAdmSearch;
    }

    this.courseService.exportCourseStudentsExcel(this.courseId, tab, search, source, scholar).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Course_\${this.courseId}_\${tab}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.exporting[tab] = false;
      },
      error: (err) => {
        console.error(`Error exporting ${tab} excel`, err);
        this.exporting[tab] = false;
      }
    });
  }

  // --- Change Handlers ---
  onMasterSearchChange() { this.masterPage = 1; this.fetchCourseStudents('remaining_applications'); }
  onMasterSizeChange() { this.masterPage = 1; this.fetchCourseStudents('remaining_applications'); }
  changeMasterPage(delta: number) { this.masterPage += delta; this.fetchCourseStudents('remaining_applications'); }

  onTotalAppSearchChange() { this.totalAppPage = 1; this.fetchCourseStudents('remaining_applications'); }
  onTotalAppSizeChange() { this.totalAppPage = 1; this.fetchCourseStudents('remaining_applications'); }
  changeTotalAppPage(delta: number) { this.totalAppPage += delta; this.fetchCourseStudents('remaining_applications'); }

  onCancelledAppSearchChange() { this.cancelledAppPage = 1; this.fetchCourseStudents('cancelled_applications'); }
  onCancelledAppSizeChange() { this.cancelledAppPage = 1; this.fetchCourseStudents('cancelled_applications'); }
  changeCancelledAppPage(delta: number) { this.cancelledAppPage += delta; this.fetchCourseStudents('cancelled_applications'); }

  onTotalAdmSearchChange() { this.totalAdmPage = 1; this.fetchCourseStudents('confirmed_admissions'); }
  onTotalAdmSizeChange() { this.totalAdmPage = 1; this.fetchCourseStudents('confirmed_admissions'); }
  changeTotalAdmPage(delta: number) { this.totalAdmPage += delta; this.fetchCourseStudents('confirmed_admissions'); }

  onCancelledAdmSearchChange() { this.cancelledAdmPage = 1; this.fetchCourseStudents('cancelled_admissions'); }
  onCancelledAdmSizeChange() { this.cancelledAdmPage = 1; this.fetchCourseStudents('cancelled_admissions'); }
  changeCancelledAdmPage(delta: number) { this.cancelledAdmPage += delta; this.fetchCourseStudents('cancelled_admissions'); }

  onConsSearchChange() { this.consPage = 1; this.fetchCourseConsultancies(); }
  onConsSizeChange() { this.consPage = 1; this.fetchCourseConsultancies(); }
  changeConsPage(delta: number) { this.consPage += delta; this.fetchCourseConsultancies(); }

  onInstSearchChange() { this.instPage = 1; this.fetchCourseInstitutions(); }
  onInstSizeChange() { this.instPage = 1; this.fetchCourseInstitutions(); }
  changeInstPage(delta: number) { this.instPage += delta; this.fetchCourseInstitutions(); }

  // --- Compatibility Getters for HTML ---
  get paginatedMasterList(): any[] { return this.masterList(); }
  get paginatedTotalApplications(): any[] { return this.totalApplications(); }
  get paginatedCancelledApplications(): any[] { return this.cancelledApplications(); }
  get paginatedTotalAdmissions(): any[] { return this.totalAdmissions(); }
  get paginatedCancelledAdmissions(): any[] { return this.cancelledAdmissions(); }
  get paginatedConsultancies(): any[] { return this.consultanciesList(); }
  get paginatedInstitutions(): any[] { return this.institutionsList(); }

  getTotalPages(totalItems: number, pageSize: number): number {
    return Math.max(1, Math.ceil(totalItems / pageSize));
  }

  // Support old single changePage if still needed
  changePage(type: string, delta: number) {
    if (type === 'master') this.changeMasterPage(delta);
    else if (type === 'totalApp') this.changeTotalAppPage(delta);
    else if (type === 'cancelledApp') this.changeCancelledAppPage(delta);
    else if (type === 'totalAdm') this.changeTotalAdmPage(delta);
    else if (type === 'cancelledAdm') this.changeCancelledAdmPage(delta);
    else if (type === 'cons') this.changeConsPage(delta);
    else if (type === 'inst') this.changeInstPage(delta);
  }

  // View/Edit/Delete methods remain the same
  goBack(): void {
    this.router.navigate(['/courses']);
  }

  onEdit() {
    this.router.navigate([], { fragment: 'edit' });
  }

  onDelete() {
    this.deleteType = 'Course';
    this.itemToDelete = { name: this.courseDetail?.basicInfo.name };
    this.showDeleteModal = true;
  }

  onViewAdmission(id: number) {
    this.router.navigate(['/admissions', id]);
  }

  onEditAdmission(id: number) {
    this.router.navigate(['/admissions', id], { fragment: 'edit' });
  }

  onDeleteAdmission(admission: any) {
    this.deleteType = 'Admission';
    this.itemToDelete = { ...admission, name: admission.studentName };
    this.showDeleteModal = true;
  }

  onViewInstitution(id: number) {
    this.router.navigate(['/institutions', id]);
  }

  onEditInstitution(id: number) {
    this.router.navigate(['/institutions', id], { fragment: 'edit' });
  }

  onDeleteInstitution(institution: any) {
    this.deleteType = 'Institution';
    this.itemToDelete = institution;
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.itemToDelete = null;
  }

  confirmDelete() {
    if (!this.itemToDelete) return;

    this.loading = true;
    let deleteObservable;

    switch (this.deleteType) {
      case 'Course':
        deleteObservable = this.courseService.deleteCourse(this.courseId);
        break;
      case 'Admission':
        deleteObservable = this.admissionService.deleteAdmission(this.itemToDelete);
        break;
      case 'Institution':
        deleteObservable = this.institutionService.deleteInstitution(this.itemToDelete);
        break;
      default:
        this.loading = false;
        this.showDeleteModal = false;
        return;
    }

    deleteObservable.subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.itemToDelete = null;
        if (this.deleteType === 'Course') {
          this.goBack();
        } else {
          this.loadCourseDetail();
        }
      },
      error: (err: any) => {
        console.error(`Error deleting ${this.deleteType}:`, err);
        this.loading = false;
        this.showDeleteModal = false;
      }
    });
  }

  scrollToTable(tableId: string): void {
    const el = document.getElementById(tableId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  clearApplicationFilter() {
    this.appFilterSource = null;
    this.appFilterScholar = null;
    this.totalAppPage = 1;
    this.fetchCourseStudents('remaining_applications');
  }

  clearAdmissionFilter() {
    this.admFilterSource = null;
    this.admFilterScholar = null;
    this.totalAdmPage = 1;
    this.fetchCourseStudents('confirmed_admissions');
  }

  onStatClick(stat: string) {
    // Reset filters
    this.appFilterSource = null;
    this.appFilterScholar = null;
    this.admFilterSource = null;
    this.admFilterScholar = null;

    if (stat === 'total_all') {
      this.scrollToTable('master-table');
    }
    else if (stat === 'scholar_adm') {
      this.admFilterScholar = true;
      this.totalAdmPage = 1;
      this.fetchCourseStudents('confirmed_admissions');
      this.scrollToTable('total-adms');
    }
    else if (stat === 'direct_adm') {
      this.admFilterSource = 'USER';
      this.totalAdmPage = 1;
      this.fetchCourseStudents('confirmed_admissions');
      this.scrollToTable('total-adms');
    }
    else if (stat === 'cons_adm') {
      this.admFilterSource = 'CONSULTANCY';
      this.totalAdmPage = 1;
      this.fetchCourseStudents('confirmed_admissions');
      this.scrollToTable('total-adms');
    }
    else if (stat === 'scholar_app') {
      this.appFilterScholar = true;
      this.totalAppPage = 1;
      this.fetchCourseStudents('remaining_applications');
      this.scrollToTable('total-apps');
    }
    else if (stat === 'direct_app') {
      this.appFilterSource = 'USER';
      this.totalAppPage = 1;
      this.fetchCourseStudents('remaining_applications');
      this.scrollToTable('total-apps');
    }
    else if (stat === 'cons_app') {
      this.appFilterSource = 'CONSULTANCY';
      this.totalAppPage = 1;
      this.fetchCourseStudents('remaining_applications');
      this.scrollToTable('total-apps');
    }
    else if (stat === 'active' || stat === 'inactive' || stat === 'dormant' || stat === 'total_cons') {
      this.scrollToTable('consultancy-section');
    }
    else if (stat === 'seats_filled' || stat === 'lateral_entry') {
      this.scrollToTable('total-adms');
    }
  }

  initChart(): void {
    this.chartOptions = {
      series: [
        {
          name: "Students",
          data: []
        }
      ],
      chart: {
        height: 350,
        type: "bar",
        toolbar: { show: false }
      },
      plotOptions: {
        bar: {
          columnWidth: "45%",
          borderRadius: 8
        }
      },
      dataLabels: { enabled: false },
      stroke: { width: 0 },
      grid: {
        show: true,
        borderColor: '#f1f5f9',
        strokeDashArray: 4,
        position: 'back'
      },
      xaxis: {
        categories: [],
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: {
            colors: "#64748b",
            fontSize: "12px",
            fontFamily: "Inter, sans-serif"
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: "#64748b",
            fontSize: "12px",
            fontFamily: "Inter, sans-serif"
          }
        }
      },
      fill: {
        type: "gradient",
        gradient: {
          shade: "light",
          type: "vertical",
          shadeIntensity: 0.25,
          gradientToColors: ["#8b5cf6"],
          inverseColors: true,
          opacityFrom: 0.85,
          opacityTo: 0.85,
          stops: [0, 100]
        }
      },
      colors: ["#6366f1"],
      tooltip: {
        theme: "light",
        y: {
          formatter: function (val) {
            return val + " Students";
          }
        }
      }
    };
  }

  updateChartData(): void {
    if (this.courseDetail?.topConsultancies && this.courseDetail.topConsultancies.length > 0) {
      const categories = this.courseDetail.topConsultancies.map(c => c.label || (c as any).consultancyName || 'Unknown');
      const values = this.courseDetail.topConsultancies.map(c => c.value !== undefined ? c.value : (c as any).admissionCount || 0);

      this.chartOptions = {
        ...this.chartOptions,
        series: [
          {
            name: "Students",
            data: values
          }
        ],
        xaxis: {
          ...this.chartOptions.xaxis,
          categories: categories
        }
      };
    }
  }

  loadCourseUserBreakdown(): void {
    this.courseService.getCourseUserBreakdown(this.courseId, this.breakdownPage - 1, this.breakdownPageSize, this.breakdownSortBy, this.breakdownSortDir).subscribe({
      next: (data) => {
        this.userBreakdownList.set(data.content || []);
        this.breakdownTotal = data.totalElements || 0;
      },
      error: (err) => {
        console.error('Error loading course user breakdown:', err);
      }
    });
  }

  onBreakdownSizeChange(): void {
    this.breakdownPage = 1;
    this.loadCourseUserBreakdown();
  }

  changeBreakdownPage(delta: number): void {
    this.breakdownPage += delta;
    this.loadCourseUserBreakdown();
  }

  onViewDetails(userId: number, userName: string, initialTab: string, city?: string, state?: string): void {
    this.modalUserId = userId;
    this.modalUserName = userName;
    this.modalInitialTab = initialTab;
    this.modalCity = city || '';
    this.modalState = state || '';
    this.showAnalyticsModal = true;

    // Push state into query parameters
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        showAnalyticsModal: 'true',
        modalUserId: userId,
        modalUserName: userName,
        modalInitialTab: initialTab,
        modalCity: city || null,
        modalState: state || null
      },
      queryParamsHandling: 'merge'
    });
  }

  onCloseAnalyticsModal(): void {
    this.showAnalyticsModal = false;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        showAnalyticsModal: null,
        modalUserId: null,
        modalUserName: null,
        modalInitialTab: null,
        modalCity: null,
        modalState: null,
        modalTab: null,
        modalSearch: null,
        modalSession: null,
        modalStartDate: null,
        modalEndDate: null,
        modalFeesStatus: null,
        modalLeadSourceId: null,
        modalReportedStatus: null,
        modalSourceType: null,
        modalConsultancyId: null,
        modalSelectedCourseId: null,
        modalSelectedUserId: null,
        modalShowFilterDrawer: null,
        modalSortColumn: null,
        modalSortDirection: null,
        modalAppStartDate: null,
        modalAppEndDate: null
      },
      queryParamsHandling: 'merge'
    });
  }

  onRecentFormsClick(days: number): void {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - days);
    const endDate = new Date();
    endDate.setDate(today.getDate() - 1);

    const formatDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        showAnalyticsModal: 'true',
        modalUserId: null,
        modalUserName: '',
        modalInitialTab: 'ALL_APPLICATIONS',
        modalTab: 'ALL_APPLICATIONS',
        modalAppStartDate: formatDate(startDate),
        modalAppEndDate: formatDate(endDate)
      },
      queryParamsHandling: 'merge'
    });
  }

  onRecentAdmissionsClick(days: number): void {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - days);
    const endDate = new Date();
    endDate.setDate(today.getDate() - 1);

    const formatDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        showAnalyticsModal: 'true',
        modalUserId: null,
        modalUserName: '',
        modalInitialTab: 'TOTAL_ADMISSIONS',
        modalTab: 'TOTAL_ADMISSIONS',
        modalStartDate: formatDate(startDate),
        modalEndDate: formatDate(endDate)
      },
      queryParamsHandling: 'merge'
    });
  }

  onViewUser(userId: number): void {
    const returnUrl = `/courses/${this.courseId}`;
    this.router.navigate(['/users', userId], { queryParams: { returnUrl } });
  }

  openBreakdownDownloadModal(): void {
    this.showBreakdownDownloadModal = true;
  }

  confirmBreakdownDownload(): void {
    this.breakdownDownloading = true;
    this.courseService.downloadCourseUserBreakdownExcel(
      this.courseId,
      this.breakdownSortBy,
      this.breakdownSortDir
    ).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `User_Wise_Breakdown_Course_${this.courseId}_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.breakdownDownloading = false;
        this.showBreakdownDownloadModal = false;
      },
      error: (err) => {
        console.error('Error downloading breakdown excel:', err);
        this.breakdownDownloading = false;
        this.showBreakdownDownloadModal = false;
      }
    });
  }
}
