import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NgApexchartsModule, ApexChart, ApexXAxis, ApexDataLabels,
  ApexPlotOptions, ApexFill, ApexLegend, ApexTooltip, ApexYAxis
} from 'ng-apexcharts';
import { ConsultancyVsCoursePoint } from '../../../../../core/models/dashboard.model';

@Component({
  selector: 'app-consultancy-course-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <!-- <div class="chart-card">
      <h4 class="chart-title">Consultancy vs Course Offered</h4>
      <ng-container *ngIf="hasData; else emptyChart">
        <apx-chart [series]="series" [chart]="chart" [xaxis]="xaxis" [yaxis]="yaxis"
          [plotOptions]="plotOptions" [fill]="fill" [legend]="legend"
          [dataLabels]="noLabels" [tooltip]="tooltip" [grid]="grid">
        </apx-chart>
      </ng-container>
      <ng-template #emptyChart>
        <div class="empty-chart">No data available</div>
      </ng-template>
    </div> -->
  `,
  styleUrl: './consultancy-course-chart.component.scss'
})
export class ConsultancyCourseChartComponent implements OnChanges {
  @Input() data: ConsultancyVsCoursePoint[] | null = null;

  private asNumber(value: unknown): number {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  private asString(value: unknown): string {
    return value == null ? '' : String(value);
  }

  hasData = false;
  chart: ApexChart = { type: 'bar', stacked: true, height: 260, toolbar: { show: false }, fontFamily: 'inherit', zoom: { enabled: false } };
  noLabels: ApexDataLabels = { enabled: false };
  tooltip: ApexTooltip = {
    theme: 'dark',
    style: { fontSize: '13px', fontFamily: 'inherit' },
    marker: { show: true },
    x: { show: true }
  };
  legend: ApexLegend = { position: 'top', horizontalAlign: 'right', fontSize: '12px', markers: { size: 8 } };
  grid = { borderColor: '#f3f4f6', strokeDashArray: 0, xaxis: { lines: { show: false } } };
  plotOptions: ApexPlotOptions = { bar: { borderRadius: 4, columnWidth: '60%' } };
  fill: ApexFill = { type: 'solid', colors: ['#3b82f6', '#a78bfa'] };
  yaxis: ApexYAxis = { labels: { style: { colors: '#9ca3af', fontSize: '11px' } } };

  series: any[] = [];
  xaxis: ApexXAxis = { categories: [], labels: { style: { colors: '#9ca3af', fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } };

  ngOnChanges(): void { this.buildChart(); }

  private buildChart(): void {
    if (!this.data?.length) { this.hasData = false; return; }
    this.hasData = true;
    this.series = [
      { name: 'Consultancy', data: this.data.map(r => this.asNumber((r as any)?.consultancy)) },
      { name: 'Courses', data: this.data.map(r => this.asNumber((r as any)?.courses)) }
    ];
    this.xaxis = { ...this.xaxis, categories: this.data.map(r => this.asString((r as any)?.name)) };
  }
}
