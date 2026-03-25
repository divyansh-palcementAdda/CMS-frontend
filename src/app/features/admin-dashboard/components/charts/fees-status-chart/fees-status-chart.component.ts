import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NgApexchartsModule, ApexChart, ApexNonAxisChartSeries,
  ApexPlotOptions, ApexLegend, ApexTooltip, ApexDataLabels
} from 'ng-apexcharts';
import { ChartData } from '../../../../../core/models/dashboard.model';

const TOKEN_COLORS = ['#a571ff', '#435fff', '#00A95B', '#FF3E3E', '#f59e0b', '#06b6d4'];

interface LegendItem { color: string; label: string; amount: string; }

@Component({
  selector: 'app-fees-status-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="fees-row">
      <!-- Fees Paid vs Unpaid -->
      <div class="fees-card">
        <h4 class="fees-title">Paid vs Unpaid</h4>
        <div class="fees-card-content">
          <ng-container *ngIf="feesSeries.length; else emptyDonut">
            <apx-chart [series]="feesSeries" [chart]="donutChart"
              [labels]="feesLabels" [colors]="feesColors"
              [legend]="bottomLegend" [plotOptions]="donutPlot"
              [dataLabels]="noLabels" [tooltip]="tooltip">
            </apx-chart>
          </ng-container>
        </div>
      </div>

      <!-- Completion Amount -->
      <div class="fees-card">
        <h4 class="fees-title">Completion Amount</h4>
        <div class="fees-card-content">
          <ng-container *ngIf="completionSeries.length; else emptyDonut">
            <apx-chart [series]="completionSeries" [chart]="donutChart"
              [labels]="completionLabels" [colors]="completionColors"
              [legend]="noLegend" [plotOptions]="completionPlot"
              [dataLabels]="noLabels" [tooltip]="tooltip">
            </apx-chart>
          </ng-container>
          <div class="total-label" *ngIf="completionTotal">Total: {{ completionTotal | number }}</div>
        </div>
      </div>

      <!-- Top 5 Consultancies -->
      <div class="fees-card">
        <h4 class="fees-title">Top 5 Consultancies</h4>
        <div class="fees-card-content">
          <ng-container *ngIf="topConsultanciesSeries.length; else emptyDonut">
            <div class="token-layout">
              <apx-chart [series]="topConsultanciesSeries" [chart]="pieChart"
                [labels]="topConsultanciesLabels" [colors]="topConsultanciesColors"
                [legend]="noLegend" [dataLabels]="noLabels" [tooltip]="tooltip"
                [plotOptions]="topConsultanciesPlot">
              </apx-chart>
              <div class="token-legend">
                <div *ngFor="let item of topConsultanciesLegend" class="token-legend-item">
                  <span class="legend-dot" [style.background]="item.color"></span>
                  <span class="legend-text" [title]="item.label">
                    <span class="truncate-text">{{ item.label }}</span>
                    <strong>{{ item.amount }}</strong>
                  </span>
                </div>
              </div>
            </div>
          </ng-container>
        </div>
      </div>
    </div>

    <ng-template #emptyDonut>
      <div class="empty-chart">No data available</div>
    </ng-template>
  `,
  styleUrl: './fees-status-chart.component.scss'
})
export class FeesStatusChartComponent implements OnChanges {
  @Input() chartData: ChartData | null = null;

  private asNumber(value: unknown): number {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  donutChart: ApexChart = { type: 'donut', height: 200, toolbar: { show: false }, fontFamily: 'inherit' };
  pieChart: ApexChart = { type: 'donut', height: 160, width: 140, toolbar: { show: false }, fontFamily: 'inherit' };
  tooltip: ApexTooltip = {
    theme: 'dark',
    style: { fontSize: '13px', fontFamily: 'inherit' },
    marker: { show: true },
    x: { show: true }
  };
  noLabels: ApexDataLabels = { enabled: false };
  noLegend: ApexLegend = { show: false };
  bottomLegend: ApexLegend = { position: 'bottom', fontSize: '12px', markers: { size: 8 } };

  donutPlot: ApexPlotOptions = {
    pie: { donut: { size: '72%', labels: { show: false } } }
  };

  completionPlot: ApexPlotOptions = {
    pie: {
      donut: {
        size: '72%', labels: {
          show: true,
          total: {
            show: true, label: 'Completed', fontSize: '13px', fontWeight: 700,
            formatter: (w) => {
              const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
              const first = w.globals.seriesTotals[0] ?? 0;
              return total ? Math.round((first / total) * 100) + ' %' : '0 %';
            },
            color: '#111827'
          }
        }
      }
    }
  };

  topConsultanciesPlot: ApexPlotOptions = {
    pie: {
      donut: {
        size: '60%', labels: {
          show: true,
          total: {
            show: true, label: 'Students', fontSize: '11px', fontWeight: 700,
            formatter: (w) => {
              const sum = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
              return sum.toLocaleString('en-IN');
            },
            color: '#111827'
          }
        }
      }
    }
  };

  feesSeries: ApexNonAxisChartSeries = [];
  feesLabels: string[] = [];
  feesColors = ['#A571FF', '#D2B8FF'];

  completionSeries: ApexNonAxisChartSeries = [];
  completionLabels: string[] = [];
  completionColors = ['#A571FF', 'rgba(67, 95, 255, 0.2)'];
  completionTotal = 0;

  topConsultanciesSeries: ApexNonAxisChartSeries = [];
  topConsultanciesLabels: string[] = [];
  topConsultanciesColors: string[] = [];
  topConsultanciesTotal = 0;
  topConsultanciesLegend: LegendItem[] = [];

  ngOnChanges(): void { this.buildCharts(); }

  private buildCharts(): void {
    const d = this.chartData;

    if (d?.feesStatus?.length) {
      this.feesSeries = d.feesStatus.map(f => this.asNumber((f as any)?.value));
      this.feesLabels = d.feesStatus.map(f => (f as any)?.name ?? '');
    } else {
      this.feesSeries = [];
    }

    if (d?.completionStatus?.length) {
      this.completionSeries = d.completionStatus.map(c => this.asNumber((c as any)?.value));
      this.completionLabels = d.completionStatus.map(c => (c as any)?.name ?? '');
      this.completionTotal = d.completionStatus.reduce((s, c) => s + this.asNumber((c as any)?.value), 0);
    } else {
      this.completionSeries = [];
      this.completionTotal = 0;
    }

    if (d?.topConsultancies?.length) {
      this.topConsultanciesSeries = d.topConsultancies.map(t => this.asNumber(t.admissionCount));
      this.topConsultanciesLabels = d.topConsultancies.map(t => t.consultancyName || '');
      this.topConsultanciesColors = d.topConsultancies.map((_, i) => TOKEN_COLORS[i % TOKEN_COLORS.length]);
      this.topConsultanciesTotal = d.topConsultancies.reduce((s, t) => s + this.asNumber(t.admissionCount), 0);
      this.topConsultanciesLegend = d.topConsultancies.map((t, i) => ({
        color: TOKEN_COLORS[i % TOKEN_COLORS.length],
        label: t.consultancyName || '',
        amount: this.asNumber(t.admissionCount).toLocaleString('en-IN')
      }));
    } else {
      this.topConsultanciesSeries = [];
      this.topConsultanciesLegend = [];
      this.topConsultanciesTotal = 0;
    }
  }
}
