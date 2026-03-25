import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { WelcomeBannerComponent } from './components/welcome-banner/welcome-banner.component';
import { StatsCardsComponent } from './components/stats-cards/stats-cards.component';
import { ManagementPanelComponent } from './components/management-panel/management-panel.component';
import { AdmissionPanelComponent } from './components/admission-panel/admission-panel.component';
import { AdmissionChartsComponent } from './components/charts/admission-charts/admission-charts.component';
import { FeesStatusChartComponent } from './components/charts/fees-status-chart/fees-status-chart.component';
import { ConsultancyCourseChartComponent } from './components/charts/consultancy-course-chart/consultancy-course-chart.component';
import { ConsultancyTableComponent } from './components/consultancy-table/consultancy-table.component';
import { RecentFormsComponent } from './components/recent-forms/recent-forms.component';
import { ActivityFeedComponent } from './components/activity-feed/activity-feed.component';

import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardData, DashboardStats, CommissionData, ChartData } from '../../core/models/dashboard.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    TopbarComponent,
    WelcomeBannerComponent,
    StatsCardsComponent,
    ManagementPanelComponent,
    AdmissionPanelComponent,
    AdmissionChartsComponent,
    FeesStatusChartComponent,
    ConsultancyCourseChartComponent,
    ConsultancyTableComponent,
    RecentFormsComponent,
    ActivityFeedComponent,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  loading = signal(true);
  error = signal<string | null>(null);

  dashboardData = signal<DashboardData | null>(null);
  stats = signal<DashboardStats | null>(null);
  commissionData = signal<CommissionData | null>(null);
  chartData = signal<ChartData | null>(null);

  constructor(private dashboardService: DashboardService) { }

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.dashboardService.loadAll().subscribe({
      next: ({ dashboard, stats, commission, charts }) => {
        this.dashboardData.set(dashboard);
        this.stats.set(stats || dashboard?.stats || null);
        this.commissionData.set(commission);
        this.chartData.set(charts);
        this.loading.set(false);
        console.log(this.stats());
        console.log(this.commissionData());
        console.log(this.chartData());
        console.log(this.dashboardData());
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load dashboard');
        this.loading.set(false);
      }
    });
  }
}
