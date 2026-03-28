import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NgApexchartsModule } from "ng-apexcharts";
import { InstitutionService } from '../../core/services/institution.service';
import { InstitutionDetail } from '../../core/models/institution.model';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-institution-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, NgApexchartsModule, SidebarComponent, TopbarComponent, FormsModule],
  templateUrl: './institution-detail.component.html',
  styleUrls: ['./institution-detail.component.scss']
})
export class InstitutionDetailComponent implements OnInit {
  id: number | null = null;
  detail: InstitutionDetail | null = null;
  loading = true;

  chartOptions: any = {
    series: [],
    chart: {
      type: 'bar',
      height: 400,
      toolbar: { show: false },
      sparkline: { enabled: false }
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: '30%',
        distributed: false,
      }
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: [],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '12px'
        }
      }
    },
    yaxis: { 
      labels: { 
        style: {
          colors: '#64748b',
          fontSize: '12px'
        }
      } 
    },
    grid: { 
      show: true,
      borderColor: '#f1f5f9',
      strokeDashArray: 2,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: "vertical",
        shadeIntensity: 0.1,
        gradientToColors: ['#818cf8'], // Lightening the top
        inverseColors: true,
        opacityFrom: 0.9,
        opacityTo: 0.7,
        stops: [0, 90, 100]
      },
    },
    colors: ['#6366F1'],
    tooltip: { y: { formatter: (val: number) => `${val}` } }
  };

  constructor(
    private route: ActivatedRoute,
    private institutionService: InstitutionService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.id = +idParam;
      this.loadDetails(this.id);
    }
  }

  loadDetails(id: number): void {
    this.loading = true;
    this.institutionService.getInstitutionDetail(id).subscribe({
      next: (data) => {
        this.detail = data;
        // Use top5Consultancies for the chart at the bottom
        this.prepareChartData(data.top5Consultancies || []);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading institution detail', err);
        this.loading = false;
      }
    });
  }

  prepareChartData(consultancies: any[]): void {
    if (!consultancies || consultancies.length === 0) return;
    
    this.chartOptions.series = [{
      name: 'Students',
      data: consultancies.map(t => t.value)
    }];
    this.chartOptions.xaxis.categories = consultancies.map(t => t.label);
  }

  goBack(): void {
    window.history.back();
  }
}
