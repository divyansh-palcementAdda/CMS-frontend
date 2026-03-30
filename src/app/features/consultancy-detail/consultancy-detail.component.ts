import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsultancyService } from '../../core/services/consultancy.service';
import { ConsultancyDetail } from '../../core/models/consultancy.model';
import {
  NgApexchartsModule,
  ApexChart,
  ApexXAxis,
  ApexPlotOptions,
  ApexDataLabels,
  ApexFill,
  ApexTooltip,
  ApexYAxis,
  ApexGrid
} from 'ng-apexcharts';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { CourseService } from '../../core/services/course.service';
import { UserService } from '../../core/services/user.service';
import { InstitutionService } from '../../core/services/institution.service';
import { AdmissionService } from '../../core/services/admission.service';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-consultancy-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule, SidebarComponent, TopbarComponent, ConfirmationModalComponent],
  templateUrl: './consultancy-detail.component.html',
  styleUrl: './consultancy-detail.component.scss'
})
export class ConsultancyDetailComponent implements OnInit {
  consultancy: ConsultancyDetail | null = null;
  loading = true;

  // Search and Pagination State
  courseSearch = '';
  coursePage = 1;
  coursePageSize = 5;

  userSearch = '';
  userPage = 1;
  userPageSize = 5;

  instSearch = '';
  instPage = 1;
  instPageSize = 5;

  admSearch = '';
  admPage = 1;
  admPageSize = 5;

  // Actions
  showDeleteModal = false;
  itemToDelete: any = null;
  deleteType: 'consultancy' | 'course' | 'user' | 'institution' | 'admission' = 'consultancy';

  // Chart Options
  public chartOptions: {
    chart: ApexChart;
    xaxis: ApexXAxis;
    plotOptions: ApexPlotOptions;
    dataLabels: ApexDataLabels;
    fill: ApexFill;
    tooltip: ApexTooltip;
    series: any[];
    colors: string[];
    yaxis: ApexYAxis;
    grid: ApexGrid;
  } = {
      series: [{
        name: 'Admission count',
        data: []
      }],
      chart: {
        type: 'bar',
        height: 350,
        toolbar: { show: false },
        fontFamily: 'Inter, sans-serif',
        animations: { enabled: true, speed: 800 }
      },
      plotOptions: {
        bar: {
          columnWidth: '35%',
          borderRadius: 8,
          distributed: false
        }
      },
      dataLabels: {
        enabled: false
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: "vertical",
          shadeIntensity: 0.5,
          gradientToColors: ['#8B5CF6'],
          inverseColors: false,
          opacityFrom: 1,
          opacityTo: 0.9,
          stops: [0, 100]
        }
      },
      colors: ['#6366F1'],
      xaxis: {
        categories: [],
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: { colors: '#64748B', fontSize: '12px', fontWeight: 500 },
          rotate: -45,
          trim: true
        }
      },
      yaxis: {
        labels: {
          style: { colors: '#64748B', fontSize: '12px' }
        }
      },
      grid: {
        borderColor: '#F1F5F9',
        strokeDashArray: 4,
        xaxis: { lines: { show: false } }
      },
      tooltip: {
        theme: 'light',
        y: { formatter: (val: number) => `${val} Admissions` }
      }
    };

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private consultancyService: ConsultancyService,
    private courseService: CourseService,
    private userService: UserService,
    private institutionService: InstitutionService,
    private admissionService: AdmissionService
  ) { }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.fetchConsultancy(id);
    }
  }

  fetchConsultancy(id: number): void {
    this.loading = true;
    this.consultancyService.getConsultancyById(id).subscribe({
      next: (data) => {
        this.consultancy = data;
        this.updateChartData(data);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching consultancy:', err);
        this.loading = false;
      }
    });
  }

  updateChartData(data: ConsultancyDetail): void {
    if (data.topCourses && data.topCourses.length > 0) {
      this.chartOptions.series = [{
        name: 'Admission count',
        data: data.topCourses.map(c => c.value)
      }];
      this.chartOptions.xaxis = {
        ...this.chartOptions.xaxis,
        categories: data.topCourses.map(c => c.label)
      };
    }
  }

  // Helper Getters for Tables (Filtering + Pagination)
  get filteredCourses() {
    if (!this.consultancy?.courses) return [];
    return this.consultancy.courses.filter(c =>
      c.name?.toLowerCase().includes(this.courseSearch.toLowerCase()) ||
      c.institution?.toLowerCase().includes(this.courseSearch.toLowerCase())
    );
  }

  get paginatedCourses() {
    const start = (this.coursePage - 1) * this.coursePageSize;
    return this.filteredCourses.slice(start, start + this.coursePageSize);
  }

  get filteredUsers() {
    if (!this.consultancy?.representatives) return [];
    return this.consultancy.representatives.filter(r =>
      r.name?.toLowerCase().includes(this.userSearch.toLowerCase()) ||
      r.email?.toLowerCase().includes(this.userSearch.toLowerCase())
    );
  }

  get paginatedUsers() {
    const start = (this.userPage - 1) * this.userPageSize;
    return this.filteredUsers.slice(start, start + this.userPageSize);
  }

  get filteredInstitutions() {
    if (!this.consultancy?.institutionsOverview) return [];
    return this.consultancy.institutionsOverview.filter(i =>
      i.institutionName?.toLowerCase().includes(this.instSearch.toLowerCase()) ||
      i.courseName?.toLowerCase().includes(this.instSearch.toLowerCase())
    );
  }

  get paginatedInstitutions() {
    const start = (this.instPage - 1) * this.instPageSize;
    return this.filteredInstitutions.slice(start, start + this.instPageSize);
  }

  get filteredAdmissions() {
    if (!this.consultancy?.allAdmissions) return [];
    return this.consultancy.allAdmissions.filter(a =>
      a.studentName?.toLowerCase().includes(this.admSearch.toLowerCase()) ||
      a.courseName?.toLowerCase().includes(this.admSearch.toLowerCase())
    );
  }

  get paginatedAdmissions() {
    const start = (this.admPage - 1) * this.admPageSize;
    return this.filteredAdmissions.slice(start, start + this.admPageSize);
  }

  // Pagination Controls
  changePage(table: 'course' | 'user' | 'inst' | 'adm', direction: number) {
    if (table === 'course') this.coursePage += direction;
    if (table === 'user') this.userPage += direction;
    if (table === 'inst') this.instPage += direction;
    if (table === 'adm') this.admPage += direction;
  }

  getTotalPages(total: number, size: number) {
    return Math.ceil(total / size) || 1;
  }

  goBack() {
    this.router.navigate(['/consultancy-management']);
  }

  onEdit() {
    this.router.navigate([], { fragment: 'edit' });
  }

  onDelete() {
    this.itemToDelete = this.consultancy;
    this.deleteType = 'consultancy';
    this.showDeleteModal = true;
  }

  // Table Actions
  onViewCourse(id: number) { this.router.navigate(['/course-management', id]); }
  onEditCourse(id: number) { this.router.navigate(['/course-management'], { fragment: 'edit' }); }
  onDeleteCourse(course: any) { this.itemToDelete = course; this.deleteType = 'course'; this.showDeleteModal = true; }

  onViewUser(id: number) { this.router.navigate(['/users', id]); }
  onEditUser(id: number) { this.router.navigate(['/users'], { fragment: 'edit' }); }
  onDeleteUser(user: any) { this.itemToDelete = user; this.deleteType = 'user'; this.showDeleteModal = true; }

  onViewInstitution(id: number) { this.router.navigate(['/institution-management', id]); }
  onEditInstitution(id: number) { this.router.navigate(['/institution-management'], { fragment: 'edit' }); }
  onDeleteInstitution(inst: any) { this.itemToDelete = inst; this.deleteType = 'institution'; this.showDeleteModal = true; }

  onViewAdmission(id: number) { this.router.navigate(['/admission-management', id]); }
  onEditAdmission(id: number) { this.router.navigate(['/admission-management'], { fragment: 'edit' }); }
  onDeleteAdmission(adm: any) { this.itemToDelete = adm; this.deleteType = 'admission'; this.showDeleteModal = true; }

  cancelDelete() {
    this.itemToDelete = null;
    this.showDeleteModal = false;
  }

  confirmDelete() {
    if (!this.itemToDelete) return;
    this.loading = true;
    let deleteObservable;

    switch (this.deleteType) {
      case 'consultancy':
        deleteObservable = this.consultancyService.deleteConsultancy(this.itemToDelete.id);
        break;
      case 'course':
        deleteObservable = this.courseService.deleteCourse(this.itemToDelete.id);
        break;
      case 'user':
        deleteObservable = this.userService.deleteUser(this.itemToDelete.id);
        break;
      case 'institution':
        deleteObservable = this.institutionService.deleteInstitution(this.itemToDelete.id);
        break;
      case 'admission':
        deleteObservable = this.admissionService.deleteAdmission(this.itemToDelete.id);
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
        if (this.deleteType === 'consultancy') {
          this.router.navigate(['/consultancy-management']);
        } else {
          this.fetchConsultancy(Number(this.route.snapshot.paramMap.get('id')));
        }
      },
      error: (err) => {
        console.error(`Error deleting ${this.deleteType}`, err);
        this.loading = false;
        this.showDeleteModal = false;
      }
    });
  }
}
