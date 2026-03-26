import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
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

@Component({
  selector: 'app-consultancy-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, NgApexchartsModule, SidebarComponent, TopbarComponent],
  templateUrl: './consultancy-detail.component.html',
  styleUrl: './consultancy-detail.component.scss'
})
export class ConsultancyDetailComponent implements OnInit {
  consultancy: ConsultancyDetail | null = null;
  loading = true;

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
        name: 'Courses count',
        data: []
      }],
      chart: {
        type: 'bar',
        height: 350,
        toolbar: { show: false },
        fontFamily: 'Inter, sans-serif'
      },
      plotOptions: {
        bar: {
          columnWidth: '45%',
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
          gradientToColors: ['#435FFF'],
          inverseColors: false,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100]
        }
      },
      colors: ['#A571FF'],
      xaxis: {
        categories: [],
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: { colors: '#64748B', fontSize: '12px', fontWeight: 500 }
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
        y: { formatter: (val: number) => `${val} Addmissions` }
      }
    };

  constructor(
    private route: ActivatedRoute,
    private consultancyService: ConsultancyService
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
    this.chartOptions.series = [{
      name: 'Addmission count',
      data: data.topCourses.map(c => c.value)
    }];
    this.chartOptions.xaxis = {
      ...this.chartOptions.xaxis,
      categories: data.topCourses.map(c => c.label)
    };
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return 'active';
    return status.toLowerCase();
  }
}
