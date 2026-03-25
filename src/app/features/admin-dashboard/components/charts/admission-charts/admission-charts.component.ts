import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NgApexchartsModule,
  ApexChart, ApexXAxis, ApexDataLabels, ApexStroke,
  ApexFill, ApexTooltip, ApexPlotOptions, ApexYAxis
} from 'ng-apexcharts';
import { ChartData } from '../../../../../core/models/dashboard.model';

@Component({
  selector: 'app-admission-charts',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="charts-2x2">
      <div class="chart-card">
        <h4 class="chart-title">Total Admission</h4>
        @if (barSeries[0]?.data?.length) {
          <apx-chart [series]="barSeries" [chart]="barChart" [xaxis]="barXAxis"
            [yaxis]="yAxis" [plotOptions]="barPlot" [fill]="barFill"
            [dataLabels]="noLabels" [tooltip]="tooltip" [grid]="grid">
          </apx-chart>
        } @else {
          <div class="empty-chart">No data available</div>
        }
      </div>

      <div class="chart-card">
        <h4 class="chart-title">Revenue monthly analysis</h4>
        @if (lineSeries[0]?.data?.length) {
          <apx-chart [series]="lineSeries" [chart]="lineChart" [xaxis]="lineXAxis"
            [yaxis]="yAxis" [stroke]="lineStroke" [fill]="solidFill"
            [dataLabels]="noLabels" [tooltip]="tooltip" [grid]="grid" [markers]="markers">
          </apx-chart>
        } @else {
          <div class="empty-chart">No data available</div>
        }
      </div>

      <div class="chart-card">
        <h4 class="chart-title">Recent Year Admission</h4>
        @if (areaSeries[0]?.data?.length) {
          <apx-chart [series]="areaSeries" [chart]="areaChart" [xaxis]="areaXAxis"
            [yaxis]="yAxis" [stroke]="areaStroke" [fill]="areaFill"
            [dataLabels]="noLabels" [tooltip]="tooltip" [grid]="grid">
          </apx-chart>
        } @else {
          <div class="empty-chart">No data available</div>
        }
      </div>

      <div class="chart-card">
        <h4 class="chart-title">Target Admission Vs Achieved Admissions</h4>
        @if (targetSeries[0]?.data?.length) {
          <apx-chart [series]="targetSeries" [chart]="targetChart" [xaxis]="targetXAxis"
            [yaxis]="yAxis" [plotOptions]="targetPlot" [fill]="targetFill"
            [dataLabels]="noLabels" [tooltip]="tooltip" [grid]="grid">
          </apx-chart>
        } @else {
          <div class="empty-chart">No data available</div>
        }
      </div>
    </div>
  `,
  styleUrl: './admission-charts.component.scss'
})
export class AdmissionChartsComponent implements OnChanges {
  @Input() chartData: ChartData | null = null;

  private asNumber(value: unknown): number {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  private asString(value: unknown): string {
    return value == null ? '' : String(value);
  }

  noLabels: ApexDataLabels = { enabled: false };
  tooltip: ApexTooltip = {
    theme: 'dark',
    style: { fontSize: '13px', fontFamily: 'inherit' },
    marker: { show: true },
    x: { show: true }
  };
  grid = {
    borderColor: '#f3f4f6',
    strokeDashArray: 0,
    xaxis: { lines: { show: false } },
    padding: { left: 25, right: 25 }
  };
  yAxis: ApexYAxis = { labels: { style: { colors: '#9ca3af', fontSize: '11px' } } };
  markers = { size: 4, colors: ['#7c3aed'], strokeColors: '#fff', strokeWidth: 2 };
  solidFill: ApexFill = { type: 'solid', colors: ['#7c3aed'] };

  barChart: ApexChart = { type: 'bar', height: 240, toolbar: { show: false }, fontFamily: 'inherit', zoom: { enabled: false } };
  barSeries: any[] = [{ name: 'Admissions', data: [] }];
  barXAxis: ApexXAxis = { categories: [], labels: { style: { colors: '#9ca3af', fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } };
  barPlot: ApexPlotOptions = { bar: { borderRadius: 4, columnWidth: '55%' } };
  barFill: ApexFill = { type: 'gradient', gradient: { shade: 'light', type: 'vertical', gradientToColors: ['#a78bfa'], stops: [0, 100] }, colors: ['#7c3aed'] };

  lineChart: ApexChart = { type: 'line', height: 240, toolbar: { show: false }, fontFamily: 'inherit', zoom: { enabled: false } };
  lineSeries: any[] = [{ name: 'Admissions', data: [] }];
  lineXAxis: ApexXAxis = { categories: [], labels: { style: { colors: '#9ca3af', fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } };
  lineStroke: ApexStroke = { curve: 'smooth', width: 2, colors: ['#7c3aed'] };

  areaChart: ApexChart = { type: 'area', height: 240, toolbar: { show: false }, fontFamily: 'inherit', zoom: { enabled: false } };
  areaSeries: any[] = [{ name: 'Admissions', data: [] }];
  areaXAxis: ApexXAxis = { categories: [], labels: { style: { colors: '#9ca3af', fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } };
  areaStroke: ApexStroke = { curve: 'smooth', width: 2, colors: ['#7c3aed'] };
  areaFill: ApexFill = { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02 }, colors: ['#a78bfa'] };

  targetChart: ApexChart = { type: 'bar', height: 240, toolbar: { show: false }, fontFamily: 'inherit', zoom: { enabled: false } };
  targetSeries: any[] = [{ name: 'Target', data: [] }, { name: 'Achieved', data: [] }];
  targetXAxis: ApexXAxis = { categories: [], labels: { style: { colors: '#9ca3af', fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } };
  targetPlot: ApexPlotOptions = { bar: { borderRadius: 4, columnWidth: '55%' } };
  targetFill: ApexFill = { type: 'solid', colors: ['#a78bfa', '#7c3aed'] };

  ngOnChanges(): void { this.buildCharts(); }

  private buildCharts(): void {
    const d = this.chartData;

    if (d?.yearlyAdmissions?.length) {
      this.barSeries = [{ name: 'Admissions', data: d.yearlyAdmissions.map(y => this.asNumber((y as any)?.admissions)) }];
      this.barXAxis = { ...this.barXAxis, categories: d.yearlyAdmissions.map(y => this.asString((y as any)?.year)) };
    } else {
      this.barSeries = [{ name: 'Admissions', data: [] }];
    }

    if (d?.weeklyAdmissions?.length) {
      this.lineSeries = [{ name: 'Admissions', data: d.weeklyAdmissions.map(w => this.asNumber((w as any)?.admissions)) }];
      this.lineXAxis = {
        ...this.lineXAxis,
        categories: d.weeklyAdmissions.map(w => {
          let str = this.asString((w as any)?.week);
          // Convert "YYYY-MM-DD - YYYY-MM-DD" to "DD/MM-DD/MM" format
          return str.replace(/\d{4}-(\d{2})-(\d{2})\s*-\s*\d{4}-(\d{2})-(\d{2})/, '$2/$1-$4/$3');
        })
      };
    } else {
      this.lineSeries = [{ name: 'Admissions', data: [] }];
    }

    if (d?.monthlyAdmissions?.length) {
      this.areaSeries = [{ name: 'Admissions', data: d.monthlyAdmissions.map(m => this.asNumber((m as any)?.admissions)) }];
      this.areaXAxis = { ...this.areaXAxis, categories: d.monthlyAdmissions.map(m => this.asString((m as any)?.month)) };
    } else {
      this.areaSeries = [{ name: 'Admissions', data: [] }];
    }

    if (d?.targetVsAchieved?.length) {
      this.targetSeries = [
        { name: 'Target', data: d.targetVsAchieved.map(t => this.asNumber((t as any)?.target)) },
        { name: 'Achieved', data: d.targetVsAchieved.map(t => this.asNumber((t as any)?.achieved)) }
      ];
      this.targetXAxis = { ...this.targetXAxis, categories: d.targetVsAchieved.map(t => this.asString((t as any)?.category)) };
    } else {
      this.targetSeries = [{ name: 'Target', data: [] }, { name: 'Achieved', data: [] }];
    }
  }
}
