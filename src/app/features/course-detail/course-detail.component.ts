import { Component, OnInit, ViewChild } from '@angular/core';
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
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';

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
  imports: [CommonModule, RouterModule, NgApexchartsModule, SidebarComponent, TopbarComponent, FormsModule, ConfirmationModalComponent],
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.scss']
})
export class CourseDetailComponent implements OnInit {
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions!: Partial<ChartOptions>;

  courseId!: number;
  courseDetail: CourseDetail | null = null;
  loading = true;
  searchTerm = '';

  // Institutions Table
  instPage = 1;
  instPageSize = 10;

  // Master Table
  masterSearch = '';
  masterPage = 1;
  masterPageSize = 10;

  // Total Applications
  totalAppSearch = '';
  totalAppPage = 1;
  totalAppPageSize = 10;

  // Cancelled Applications
  cancelledAppSearch = '';
  cancelledAppPage = 1;
  cancelledAppPageSize = 10;

  // Total Admissions
  totalAdmSearch = '';
  totalAdmPage = 1;
  totalAdmPageSize = 10;

  // Cancelled Admissions
  cancelledAdmSearch = '';
  cancelledAdmPage = 1;
  cancelledAdmPageSize = 10;

  // Consultancies table from HTML
  consPage = 1;
  consPageSize = 10;
  consultancyStatusFilter: string = '';

  appFilterSource: string = '';
  appFilterScholar: boolean = false;
  admFilterSource: string = '';
  admFilterScholar: boolean = false;

  // Actions
  showDeleteModal = false;
  deleteType: string = '';
  itemToDelete: any = null;

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
    this.route.params.subscribe(params => {
      this.courseId = +params['id'];
      this.loadCourseDetail();
    });
  }

  loadCourseDetail(): void {
    this.loading = true;
    this.courseService.getCourseDetail(this.courseId).subscribe({
      next: (data) => {
        this.courseDetail = data;
        this.updateChartData();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading course detail:', err);
        this.loading = false;
      }
    });
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
          gradientToColors: ["#8b5cf6"], // Purple at bottom
          inverseColors: true,
          opacityFrom: 0.85,
          opacityTo: 0.85,
          stops: [0, 100]
        }
      },
      colors: ["#6366f1"], // Indigo at top
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

  // Admission Actions
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

  // Institution Actions
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

  onStatClick(stat: string) {
    this.clearAdmissionFilter();
    this.clearApplicationFilter();

    const statusMap: any = {
      active: 'ACTIVE',
      inactive: 'INACTIVE',
      dormant: 'DORMANT'
    };

    if (statusMap[stat] || stat === 'total_cons') {
      this.consultancyStatusFilter = statusMap[stat] || '';
      this.scrollToTable('consultancy-section');
    }
    else if (stat === 'total_all') {
      this.scrollToTable('master-table');
    }
    else if (stat === 'scholar_adm') {
      this.admFilterScholar = true;
      this.scrollToTable('total-adms');
    }
    else if (stat === 'direct_adm') {
      this.admFilterSource = 'USER';
      this.scrollToTable('total-adms');
    }
    else if (stat === 'cons_adm') {
      this.admFilterSource = 'CONSULTANCY';
      this.scrollToTable('total-adms');
    }
    else if (stat === 'scholar_app') {
      this.appFilterScholar = true;
      this.scrollToTable('total-apps');
    }
    else if (stat === 'direct_app') {
      this.appFilterSource = 'USER';
      this.scrollToTable('total-apps');
    }
    else if (stat === 'cons_app') {
      this.appFilterSource = 'CONSULTANCY';
      this.scrollToTable('total-apps');
    }
  }

  scrollToTable(tableId: string): void {
    const el = document.getElementById(tableId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
      error: (err) => {
        console.error(`Error deleting ${this.deleteType}:`, err);
        this.loading = false;
        this.showDeleteModal = false;
      }
    });
  }

  getTotalPages(totalItems: number, pageSize: number): number {
    return Math.ceil(totalItems / pageSize);
  }

  changePage(type: string, delta: number) {
    if (type === 'master') {
      this.masterPage += delta;
    } else if (type === 'totalApp') {
      this.totalAppPage += delta;
    } else if (type === 'cancelledApp') {
      this.cancelledAppPage += delta;
    } else if (type === 'totalAdm') {
      this.totalAdmPage += delta;
    } else if (type === 'cancelledAdm') {
      this.cancelledAdmPage += delta;
    } else if (type === 'cons') {
      this.consPage += delta;
    } else if (type === 'inst') {
      this.instPage += delta;
    }
  }

  clearApplicationFilter() {
    this.appFilterSource = '';
    this.appFilterScholar = false;
  }

  clearAdmissionFilter() {
    this.admFilterSource = '';
    this.admFilterScholar = false;
  }

  get filteredTotalApplications(): any[] {
    if (!this.courseDetail || !this.courseDetail.totalApplications) return [];
    const search = this.totalAppSearch.toLowerCase();
    return this.courseDetail.totalApplications.filter(item => {
      const name = item.studentName || item.fullName || '';
      const course = item.courseName || '';
      const matchesSearch = name.toLowerCase().includes(search) || course.toLowerCase().includes(search);
      const itemSource = (item.source || item.admissionSource || '').toLowerCase();
      const matchesSource = !this.appFilterSource || itemSource === this.appFilterSource.toLowerCase();
      const isScholarItem = item.isScholar === true || item.isScholler === true || item.isScholar === 'true' || item.isScholler === 'true' || item.isScholar === 1 || item.isScholler === 1 || item.isScholar === 'YES' || item.isScholler === 'YES';
      const matchesScholar = this.appFilterScholar === false || (isScholarItem === this.appFilterScholar);
      return matchesSearch && matchesSource && matchesScholar;
    });
  }

  get paginatedTotalApplications(): any[] {
    const start = (this.totalAppPage - 1) * this.totalAppPageSize;
    return this.filteredTotalApplications.slice(start, start + this.totalAppPageSize);
  }

  get filteredCancelledApplications(): any[] {
    if (!this.courseDetail || !this.courseDetail.cancelledApplications) return [];
    const search = this.cancelledAppSearch.toLowerCase();
    return this.courseDetail.cancelledApplications.filter(item =>
      item.studentName.toLowerCase().includes(search) || item.courseName.toLowerCase().includes(search)
    );
  }

  get paginatedCancelledApplications(): any[] {
    const start = (this.cancelledAppPage - 1) * this.cancelledAppPageSize;
    return this.filteredCancelledApplications.slice(start, start + this.cancelledAppPageSize);
  }

  get filteredTotalAdmissions(): any[] {
    if (!this.courseDetail || !this.courseDetail.totalAdmissions) return [];
    const search = this.totalAdmSearch.toLowerCase();
    return this.courseDetail.totalAdmissions.filter(item => {
      const name = item.studentName || item.fullName || '';
      const course = item.courseName || '';
      const matchesSearch = name.toLowerCase().includes(search) || course.toLowerCase().includes(search);
      const itemSource = (item.source || item.admissionSource || '').toLowerCase();
      const matchesSource = !this.admFilterSource || itemSource === this.admFilterSource.toLowerCase();
      const isScholarItem = item.isScholar === true || item.isScholler === true || item.isScholar === 'true' || item.isScholler === 'true' || item.isScholar === 1 || item.isScholler === 1 || item.isScholar === 'YES' || item.isScholler === 'YES';
      const matchesScholar = this.admFilterScholar === false || (isScholarItem === this.admFilterScholar);
      return matchesSearch && matchesSource && matchesScholar;
    });
  }

  get paginatedTotalAdmissions(): any[] {
    const start = (this.totalAdmPage - 1) * this.totalAdmPageSize;
    return this.filteredTotalAdmissions.slice(start, start + this.totalAdmPageSize);
  }

  get filteredCancelledAdmissions(): any[] {
    if (!this.courseDetail || !this.courseDetail.cancelledAdmissions) return [];
    const search = this.cancelledAdmSearch.toLowerCase();
    return this.courseDetail.cancelledAdmissions.filter(item =>
      item.studentName.toLowerCase().includes(search) || item.courseName.toLowerCase().includes(search)
    );
  }

  get paginatedCancelledAdmissions(): any[] {
    const start = (this.cancelledAdmPage - 1) * this.cancelledAdmPageSize;
    return this.filteredCancelledAdmissions.slice(start, start + this.cancelledAdmPageSize);
  }

  get filteredMasterList(): any[] {
    if (!this.courseDetail) return [];
    const all = [
      ...(this.courseDetail.totalApplications || []),
      ...(this.courseDetail.totalAdmissions || []),
      ...(this.courseDetail.cancelledApplications || []),
      ...(this.courseDetail.cancelledAdmissions || [])
    ];
    const search = this.masterSearch.toLowerCase();
    return all.filter(item => {
      const name = item.studentName || item.fullName || '';
      const course = item.courseName || '';
      return name.toLowerCase().includes(search) || course.toLowerCase().includes(search);
    });
  }

  get paginatedMasterList(): any[] {
    const start = (this.masterPage - 1) * this.masterPageSize;
    return this.filteredMasterList.slice(start, start + this.masterPageSize);
  }

  get filteredConsultancies(): any[] {
    if (!this.courseDetail || !this.courseDetail.consultancies) return [];
    if (!this.consultancyStatusFilter) return this.courseDetail.consultancies;
    return this.courseDetail.consultancies; // Update if courseDetail has consultancy status filtering later
  }

  get paginatedConsultancies(): any[] {
    const start = (this.consPage - 1) * this.consPageSize;
    return this.filteredConsultancies.slice(start, start + this.consPageSize);
  }

  get filteredInstitutions(): any[] {
    if (!this.courseDetail || !this.courseDetail.institutions) return [];
    if (!this.searchTerm) return this.courseDetail.institutions;
    const search = this.searchTerm.toLowerCase();
    return this.courseDetail.institutions.filter(item =>
      item.name.toLowerCase().includes(search) || item.code.toLowerCase().includes(search)
    );
  }

  get paginatedInstitutions(): any[] {
    const start = (this.instPage - 1) * this.instPageSize;
    return this.filteredInstitutions.slice(start, start + this.instPageSize);
  }

}
