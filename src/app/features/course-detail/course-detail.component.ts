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
          formatter: function(val) {
            return val + " Students";
          }
        }
      }
    };
  }

  updateChartData(): void {
    if (this.courseDetail?.topConsultancies) {
      const categories = this.courseDetail.topConsultancies.map(c => c.label);
      const values = this.courseDetail.topConsultancies.map(c => c.value);

      this.chartOptions.series = [
        {
          name: "Students",
          data: values
        }
      ];
      this.chartOptions.xaxis = {
        ...this.chartOptions.xaxis,
        categories: categories
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

  confirmDelete() {
    if (!this.itemToDelete) return;

    this.loading = true;
    let deleteObservable;

    switch (this.deleteType) {
      case 'Course':
        deleteObservable = this.courseService.deleteCourse(this.courseId);
        break;
      case 'Admission':
        deleteObservable = this.admissionService.deleteAdmission(this.itemToDelete.id);
        break;
      case 'Institution':
        deleteObservable = this.institutionService.deleteInstitution(this.itemToDelete.id);
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
}
