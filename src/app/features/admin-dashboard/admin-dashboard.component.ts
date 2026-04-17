import { Component, OnInit, signal, inject } from '@angular/core';
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
import { ConsultancyService } from '../../core/services/consultancy.service';
import { AdmissionService } from '../../core/services/admission.service';
import { Router } from '@angular/router';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';
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
    ConfirmationModalComponent
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

  // Actions
  showDeleteModal = false;
  deleteType: 'Consultancy' | 'Admission' = 'Consultancy';
  itemToDelete: any = null;

  private dashboardService = inject(DashboardService);
  private consultancyService = inject(ConsultancyService);
  private admissionService = inject(AdmissionService);
  private router = inject(Router);

  constructor() { }

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
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load dashboard');
        this.loading.set(false);
      }
    });
  }

  // Consultancy Actions
  onViewConsultancy(id: number) {
    this.router.navigate(['/consultancy', id]);
  }

  onEditConsultancy(id: number) {
    this.router.navigate(['/consultancy', id], { fragment: 'edit' });
  }

  onDeleteConsultancy(item: any) {
    this.deleteType = 'Consultancy';
    this.itemToDelete = item;
    this.showDeleteModal = true;
  }

  onViewAllConsultancies() {
    this.router.navigate(['/consultancy']);
  }

  // Admission Actions (from Recent Forms)
  onViewAdmission(id: number) {
    this.router.navigate(['/admissions', id]);
  }

  onEditAdmission(id: number) {
    this.router.navigate(['/admissions', id], { fragment: 'edit' });
  }

  onDeleteAdmission(item: any) {
    this.deleteType = 'Admission';
    this.itemToDelete = item;
    this.showDeleteModal = true;
  }

  onViewAllAdmissions() {
    this.router.navigate(['/admin/admission-management'], { queryParams: { tab: 'applications' } });
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.itemToDelete = null;
  }

  confirmDelete() {
    if (!this.itemToDelete) return;

    this.loading.set(true);
    const id = this.itemToDelete.id;
    const obs = this.deleteType === 'Consultancy' 
      ? this.consultancyService.deleteConsultancy(id)
      : this.admissionService.deleteAdmission(id);

    obs.subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.itemToDelete = null;
        this.loadData(); // Refresh dashboard
      },
      error: (err) => {
        console.error(`Error deleting ${this.deleteType}`, err);
        this.loading.set(false);
        this.showDeleteModal = false;
      }
    });
  }
}
