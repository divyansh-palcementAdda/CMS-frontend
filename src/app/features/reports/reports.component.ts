import { Component, OnInit, OnDestroy, inject, ViewChild } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsService, ReportFilter } from '../../core/services/reports.service';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { finalize, Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTooltip,
  ApexStroke,
  ApexYAxis,
  ApexTitleSubtitle,
  ApexLegend,
  ApexPlotOptions,
  ApexResponsive,
  ApexTheme,
  ApexFill
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries | any;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  yaxis: ApexYAxis;
  title: ApexTitleSubtitle;
  legend: ApexLegend;
  plotOptions: ApexPlotOptions;
  responsive: ApexResponsive[];
  colors: string[];
  theme: ApexTheme;
  fill: ApexFill;
  labels: string[];
  grid: any;
  markers: any;
};

// --- Premium Chart Design Tokens ---
const CHART_COLORS = [
    '#435fff', // Primary Brand (Indigo)
    '#00d2ff', // Electric Blue
    '#34d399', // Emerald Green
    '#f472b6', // Soft Pink
    '#fbbf24', // Amber
    '#a78bfa', // Lavender
    '#2dd4bf', // Teal
    '#fb7185', // Rose
    '#94a3b8'  // Slate (Neutral)
];

const COMMON_CHART_OPTIONS = {
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    toolbar: { show: false },
    zoom: { enabled: false },
    pan: { enabled: false },
    selection: { enabled: false },
    animations: { 
        enabled: true, 
        easing: 'easeinout', 
        speed: 800,
        animateGradually: { enabled: true, delay: 150 },
        dynamicAnimation: { enabled: true, speed: 350 }
    },
    states: {
        active: { allowMultipleDataPointsSelection: false },
        hover: { filter: { type: 'lighten', value: 0.15 } }
    }
};

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent, NgApexchartsModule],
  providers: [DecimalPipe],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit, OnDestroy {
  private reportsService = inject(ReportsService);
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  loading = false;
  showReportSelector = false;
  activeReport = 'COURSE_LEAD_SOURCE';
  reportData: any[] = [];
  leadSourceHeaders: string[] = [];

  // Pagination
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 25, 50, 100];
  protected readonly Math = Math;

  filters: ReportFilter = {
    filterType: 'TODAY',
    session: new Date().getFullYear().toString(),
    search: '',
    page: 0,
    size: 10
  };

  serverSummary: any = { 
    totalApplications: 0, 
    confirmedAdmissions: 0, 
    realizedRevenue: 0, 
    outstandingDues: 0, 
    conversionRate: 0 
  };
  dailySummaryData: any = null;
  sessionCumulativeStats: any = null;
  totalElements = 0;
  serverPages = 0;

  // Custom Date Picker State
  showCustomDatePicker = false;
  customStartDate = '';
  customEndDate = '';
  dateRangeValidationError = '';
  
  overallLeadSourceTotals: any[] = [];
  overallTotalForms = 0;
  overallTotalConfirmed = 0;
  overallTotalFeesReceived = 0;
  aggregatedTotals: any = null;
  projectedRevenue = 0;
  userPerformanceGrandTotal: { totalForms: number; totalConfirmed: number } = {
    totalForms: 0,
    totalConfirmed: 0
  };

  sessions: string[] = [];
  
  // Chart configs
  public barChartOptions: Partial<ChartOptions> | any;
  public pieChartOptions: Partial<ChartOptions> | any;
  public lineChartOptions: Partial<ChartOptions> | any;
  public revenueBarChartOptions: Partial<ChartOptions> | any;
  public revenueDonutChartOptions: Partial<ChartOptions> | any;
  public revenueHorizontalBarChartOptions: Partial<ChartOptions> | any;

  get paginatedData() {
    return this.reportData;
  }

  get totalPages() {
    return this.serverPages;
  }

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.filters.page = 0;
      this.loadReport();
    });

    this.generateSessions();
    this.loadReport();
    if (this.activeReport === 'DAILY_SESSION_SUMMARY') {
      this.loadSessionCumulativeStats();
    }
  }

  private generateSessions() {
    const currentYear = new Date().getFullYear();
    const years = ['OVERALL'];
    for (let i = 5; i >= 0; i--) {
      years.push((currentYear - i).toString());
    }
    this.sessions = years;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  nextPage() { 
    if (this.filters.page! < this.serverPages - 1) {
      this.filters.page!++;
      this.loadReport();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevPage() { 
    if (this.filters.page! > 0) {
      this.filters.page!--;
      this.loadReport();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  setPage(p: number) { 
    this.filters.page = p - 1;
    this.loadReport();
  }

  onSearch() {
    this.searchSubject.next(this.filters.search || '');
  }

  onPageSizeChange() {
    this.filters.size = this.pageSize;
    this.filters.page = 0;
    this.loadReport();
  }

  onDateFilterChange() {
    if (this.filters.filterType === 'CUSTOM') {
      this.showCustomDatePicker = true;
      this.customStartDate = this.filters.startDate || '';
      this.customEndDate = this.filters.endDate || '';
      this.dateRangeValidationError = '';
    } else {
      this.showCustomDatePicker = false;
      this.filters.startDate = undefined;
      this.filters.endDate = undefined;
      this.filters.page = 0;
      this.loadReport();
    }
  }

  onCustomDateChange() {
    this.validateDateRange();
  }

  validateDateRange() {
    this.dateRangeValidationError = '';
    if (!this.customStartDate || !this.customEndDate) {
      return;
    }
    const start = new Date(this.customStartDate);
    const end = new Date(this.customEndDate);
    if (end < start) {
      this.dateRangeValidationError = 'End Date cannot be before Start Date';
    }
  }

  applyCustomDateRange() {
    this.validateDateRange();
    if (this.dateRangeValidationError) {
      return;
    }
    if (!this.customStartDate || !this.customEndDate) {
      this.dateRangeValidationError = 'Please select a valid date range';
      return;
    }

    this.filters.startDate = this.customStartDate;
    this.filters.endDate = this.customEndDate;
    this.filters.page = 0;
    this.showCustomDatePicker = false;
    this.loadReport();
  }

  cancelCustomDate() {
    this.showCustomDatePicker = false;
    if (!this.filters.startDate || !this.filters.endDate) {
      this.filters.filterType = 'TODAY';
      this.onDateFilterChange();
    }
  }

  clearCustomDateRange() {
    this.filters.startDate = undefined;
    this.filters.endDate = undefined;
    this.filters.filterType = 'TODAY';
    this.showCustomDatePicker = false;
    this.filters.page = 0;
    this.loadReport();
  }

  formatCustomDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = date.getDate().toString().padStart(2, '0');
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      
      return `${day} ${month} ${year}`;
    } catch (e) {
      return dateStr;
    }
  }

  get summaryStats() {
    return this.serverSummary;
  }

  get totalsRow() {
    if (this.activeReport === 'COURSE_LEAD_SOURCE') {
        const at = this.aggregatedTotals || {};
        const leadSourceTotals = this.leadSourceHeaders.map(h => {
            const prefix = this.getLeadSourceKeyPrefix(h);
            return {
                forms: at[prefix + 'Forms'] ?? 0,
                fees: at[prefix + 'Fees'] ?? 0
            };
        });
        const totalFeesReceived = leadSourceTotals.reduce((sum, t) => sum + t.fees, 0);
        return {
            revConfirmed: 0,
            revProjected: 0,
            revCollected: 0,
            revRefunded: 0,
            revNet: 0,
            revRemaining: 0,
            totalForms: at.totalForms ?? 0,
            totalConfirmed: at.confirmed ?? 0,
            totalFeesCollected: 0,
            totalRemaining: 0,
            totalRevenue: 0,
            totalFeesPaid: 0,
            totalRemainingFees: 0,
            totalRefunded: 0,
            totalStudents: this.totalElements,
            totalFeesReceived: totalFeesReceived,
            leadSourceTotals: leadSourceTotals
        };
    }

    if (this.activeReport === 'USER_ADMISSION') {
        return {
            revConfirmed: 0,
            revProjected: 0,
            revCollected: 0,
            revRefunded: 0,
            revNet: 0,
            revRemaining: 0,
            totalForms: this.userPerformanceGrandTotal.totalForms,
            totalConfirmed: this.userPerformanceGrandTotal.totalConfirmed,
            totalFeesCollected: 0,
            totalRemaining: 0,
            totalRevenue: 0,
            totalFeesPaid: 0,
            totalRemainingFees: 0,
            totalRefunded: 0,
            totalStudents: this.totalElements,
            totalFeesReceived: 0,
            leadSourceTotals: []
        };
    }

    if (this.activeReport === 'COURSE_REVENUE') {
        const revConfirmed = this.serverSummary.confirmedAdmissions || 0;
        const revCollected = this.serverSummary.realizedRevenue || 0;
        const revRefunded = this.serverSummary.totalRefunded || 0;
        const revNet = this.serverSummary.netCollected || 0;
        const revRemaining = this.serverSummary.outstandingDues || 0;
        const revProjected = this.projectedRevenue || (revCollected + revRemaining);

        return {
            revConfirmed,
            revProjected,
            revCollected,
            revRefunded,
            revNet,
            revRemaining,
            totalForms: this.serverSummary.totalApplications || 0,
            totalConfirmed: revConfirmed,
            totalFeesCollected: revCollected,
            totalRemaining: revRemaining,
            totalRevenue: revProjected,
            totalFeesPaid: revCollected,
            totalRemainingFees: revRemaining,
            totalRefunded: revRefunded,
            totalStudents: this.totalElements,
            totalFeesReceived: 0,
            leadSourceTotals: []
        };
    }

    return {
        revConfirmed: 0,
        revProjected: 0,
        revCollected: 0,
        revRefunded: 0,
        revNet: 0,
        revRemaining: 0,
        totalForms: this.serverSummary.totalApplications || 0,
        totalConfirmed: this.serverSummary.confirmedAdmissions || 0,
        totalFeesCollected: this.serverSummary.realizedRevenue || 0,
        totalRemaining: this.serverSummary.outstandingDues || 0,
        totalRevenue: this.serverSummary.realizedRevenue || 0,
        totalFeesPaid: this.serverSummary.realizedRevenue || 0,
        totalRemainingFees: this.serverSummary.outstandingDues || 0,
        totalRefunded: this.serverSummary.totalRefunded || 0,
        totalStudents: this.totalElements,
        totalFeesReceived: 0,
        leadSourceTotals: []
    };
  }

  getLeadSourceKeyPrefix(name: string): string {
    if (!name) return 'unknown';
    const normalized = name.trim().toLowerCase();
    switch (normalized) {
      case 'consultant': return 'consultant';
      case 'orai': return 'orai';
      case 'digital': return 'digital';
      case 'reference': return 'reference';
      case 'raw data':
      case 'raw_data':
      case 'rawdata': return 'rawData';
      case 'direct': return 'direct';
      default:
        const parts = normalized.split(/\s+/);
        let prefix = parts[0];
        for (let i = 1; i < parts.length; i++) {
          if (parts[i]) {
            prefix += parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
          }
        }
        return prefix;
    }
  }

  formatUserContribution(userName: string, formCount: number): string {
    const name = (userName || 'Unknown').trim();
    return `${name} → ${formCount ?? 0}`;
  }

  getLeadVal(d: any, h: string, type: 'forms' | 'fees'): number {
    if (!d.leadSources) return 0;
    const stat = d.leadSources.find((s: any) => s.leadSourceName === h);
    if (!stat) return 0;
    return type === 'forms' ? stat.formsReceived : (stat.feesReceivedCount || 0);
  }

  reportTypes = [
    { id: 'COURSE_LEAD_SOURCE', label: 'Lead Source Matrix', icon: 'grid_view', desc: 'Course-wise lead source distribution', color: 'indigo' },
    { id: 'USER_ADMISSION', label: 'User Performance', icon: 'person_search', desc: 'Counselor-wise form volume', color: 'purple' },
    { id: 'COURSE_REVENUE', label: 'Revenue Analysis', icon: 'payments', desc: 'Fees collection vs pending dues', color: 'emerald' },
    { id: 'DAILY_SESSION_SUMMARY', label: 'Session Operational Report', icon: 'analytics', desc: 'Daily MIS & Session Summary', color: 'orange' },
    { id: 'COURSE_ANALYTICS_APP', label: 'Application Trends', icon: 'description', desc: 'Form volume and status tracking', color: 'blue' },
    { id: 'COURSE_ANALYTICS_ADMISSION', label: 'Admission Metrics', icon: 'how_to_reg', desc: 'Confirmed vs cancelled adms', color: 'rose' },
    { id: 'DAILY_FEES', label: 'Daily Collection', icon: 'account_balance_wallet', desc: 'Real-time financial tracking', color: 'cyan' },
    { id: 'LEAD_SOURCE_CONVERSION', label: 'Lead Conversion', icon: 'query_stats', desc: 'Conversion rate by source', color: 'amber' },
    { id: 'COURSE_SUMMARY', label: 'Program Summary', icon: 'summarize', desc: 'Full academic year overview', color: 'slate' },
    { id: 'STUDENT_DETAIL', label: 'Student Thresholds', icon: 'group', desc: '50% fee payment status', color: 'violet' },
  ];

  setReport(type: string) {
    this.activeReport = type;
    this.reportData = [];
    this.filters.page = 0;
    this.barChartOptions = null;
    this.pieChartOptions = null;
    this.lineChartOptions = null;
    this.loadReport();
    if (type === 'DAILY_SESSION_SUMMARY') {
      this.loadSessionCumulativeStats();
    }
  }

  loadSessionCumulativeStats() {
    if (this.activeReport !== 'DAILY_SESSION_SUMMARY') {
      return;
    }
    const sessionVal = this.filters.session === 'OVERALL' ? '' : (this.filters.session || '');
    this.reportsService.getSessionCumulativeStats(sessionVal).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res: any) => {
        console.log('Session Cumulative Stats Response:', res);
        if (res && res.data) {
          this.sessionCumulativeStats = res.data;
        }
      },
      error: (err) => {
        console.error('Failed to load session cumulative stats:', err);
      }
    });
  }

  onSessionChange() {
    this.filters.page = 0;
    this.loadReport();
    if (this.activeReport === 'DAILY_SESSION_SUMMARY') {
      this.loadSessionCumulativeStats();
    }
  }

  syncReport() {
    this.loadReport();
    if (this.activeReport === 'DAILY_SESSION_SUMMARY') {
      this.loadSessionCumulativeStats();
    }
  }

  loadReport() {
    if (this.filters.filterType === 'CUSTOM') {
      if (!this.filters.startDate || !this.filters.endDate) {
        this.showCustomDatePicker = true;
        this.dateRangeValidationError = 'Please select a valid date range';
        return;
      }
    }
    this.loading = true;
    
    const apiFilter: ReportFilter = { ...this.filters };
    console.log('Reports: Outgoing Payload ->', apiFilter);
    
    if (apiFilter.session === 'OVERALL') {
      apiFilter.session = undefined;
    }

    let obs;
    const baseType = this.getBaseReportType(this.activeReport);

    switch (baseType) {
      case 'COURSE_ANALYTICS':
        obs = this.activeReport === 'COURSE_REVENUE'
          ? this.reportsService.getCourseRevenueReport(apiFilter)
          : this.reportsService.getCourseAnalyticsReport(apiFilter);
        break;
      case 'COURSE_LEAD_SOURCE':
        obs = this.reportsService.getCourseLeadSourceReport(apiFilter);
        break;
      case 'LEAD_SOURCE_CONVERSION':
        obs = this.reportsService.getLeadSourceConversionReport(apiFilter);
        break;
      case 'USER_ADMISSION':
        obs = this.reportsService.getUserAdmissionReport(apiFilter);
        break;
      case 'STUDENT_DETAIL':
        obs = this.reportsService.getStudentDetailReport(apiFilter);
        break;
      case 'DAILY_SESSION_SUMMARY':
        obs = this.reportsService.getDailySessionSummaryReport(apiFilter);
        break;
    }

    if (obs) {
      obs.pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      ).subscribe({
        next: (res: any) => {
          console.log('Reports: Raw Response ->', res);
          const apiData = res.data; // CRITICAL FIX: Backend wraps response in 'data' object

          if (!apiData) {
            console.warn('Reports: API Data missing in response!');
            this.reportData = [];
            this.totalElements = 0;
            this.serverPages = 0;
            return;
          }

          if (this.activeReport === 'DAILY_SESSION_SUMMARY') {
            this.reportData = apiData.content || [];
            this.dailySummaryData = this.reportData.length > 0 ? this.reportData[0] : null;
          } else {
            this.dailySummaryData = null;
            this.reportData = (apiData.content || []).filter((d: any) => {
              if (this.activeReport === 'STUDENT_DETAIL') return true;
              if (this.activeReport === 'COURSE_LEAD_SOURCE') {
                return (d.totalForms || 0) > 0
                  || (d.totalFeesReceived || 0) > 0
                  || (d.totalConfirmedAdmissions || 0) > 0;
              }
              if (this.activeReport === 'COURSE_REVENUE') {
                return (d.totalConfirmedAdmissions || 0) > 0;
              }
              return (d.totalForms || 0) > 0;
            });
          }
          
          this.totalElements = apiData.totalElements || 0;
          this.serverPages = apiData.totalPages || 0;
          
          console.log('Mapped API Data', apiData);
          console.log('Table Data', this.reportData);
          console.log('Total Elements', this.totalElements);

          if (apiData.summaryStats) {
            this.serverSummary = apiData.summaryStats;
            console.log('Summary Stats', this.serverSummary);
          }

          this.aggregatedTotals = apiData.aggregatedTotals || null;
          console.log("Aggregated Totals:", this.aggregatedTotals);

          if (apiData.meta) {
            this.overallLeadSourceTotals = apiData.meta.overallLeadSourceTotals || [];
            this.overallTotalForms = apiData.meta.overallTotalForms || 0;
            this.overallTotalConfirmed = apiData.meta.overallTotalConfirmed || 0;
            this.overallTotalFeesReceived = apiData.meta.overallTotalFeesReceived || 0;
            this.projectedRevenue = apiData.meta.projectedRevenue != null
              ? Number(apiData.meta.projectedRevenue)
              : 0;
            this.userPerformanceGrandTotal = {
              totalForms: Number(apiData.meta.grandTotalForms || 0),
              totalConfirmed: Number(apiData.meta.grandTotalConfirmed || 0)
            };
          } else {
            this.overallLeadSourceTotals = [];
            this.overallTotalForms = 0;
            this.overallTotalConfirmed = 0;
            this.overallTotalFeesReceived = 0;
            this.projectedRevenue = 0;
            this.userPerformanceGrandTotal = { totalForms: 0, totalConfirmed: 0 };
          }

          if (baseType === 'COURSE_LEAD_SOURCE' && this.reportData.length > 0 && this.reportData[0].leadSources) {
            this.leadSourceHeaders = this.reportData[0].leadSources.map((ls: any) => ls.leadSourceName);
          }
          
          setTimeout(() => this.initCharts(), 10);
        },
        error: (err) => {
          console.error('Reports: API Error ->', err);
          this.loading = false;
        }
      });
    } else {
      this.loading = false;
    }
  }

  getBaseReportType(type: string): string {
    if (type.startsWith('COURSE_ANALYTICS') || type === 'COURSE_SUMMARY' || type === 'COURSE_REVENUE' || type === 'DAILY_FEES') {
      return 'COURSE_ANALYTICS';
    }
    if (type === 'DAILY_SESSION_SUMMARY') {
      return 'DAILY_SESSION_SUMMARY';
    }
    return type;
  }

  private initCharts() {
    if (!this.reportData || this.reportData.length === 0) {
      this.clearCharts();
      return;
    }

    const data = this.reportData;
    const labels = data.map((d: any) => {
        const name = d.courseName || d.studentName || 'N/A';
        return name.length > 25 ? name.substring(0, 23) + '...' : name;
    });

    // 1. LEAD SOURCE MATRIX - Modern Horizontal Stacked Bars
    if (this.activeReport === 'COURSE_LEAD_SOURCE') {
        const chartData = data.slice(0, 20); 
        const dynamicHeight = Math.max(chartData.length * 65, 600);

        const series = this.leadSourceHeaders.map(ls => ({
            name: ls,
            data: chartData.map((d: any) => {
                const stat = d.leadSources?.find((s: any) => s.leadSourceName === ls);
                return stat ? stat.formsReceived : 0;
            })
        }));

        this.barChartOptions = {
            series: series,
            chart: { 
                ...COMMON_CHART_OPTIONS, 
                type: 'bar', 
                height: dynamicHeight, 
                stacked: true,
                toolbar: { show: false },
                zoom: { enabled: false }
            },
            plotOptions: {
                bar: { 
                    horizontal: true, 
                    barHeight: '58%', 
                    borderRadius: 8,
                    borderRadiusApplication: 'end',
                    dataLabels: { position: 'center' }
                }
            },
            colors: CHART_COLORS,
            xaxis: { 
                categories: chartData.map(d => d.courseName),
                labels: { 
                    style: { colors: '#94a3b8', fontWeight: 600 },
                    formatter: (val: any) => Math.floor(val).toString() 
                },
                axisBorder: { show: false },
                axisTicks: { show: false }
            },
            yaxis: { 
                labels: { 
                    style: { colors: '#1e293b', fontWeight: 700, fontSize: '13px' }, 
                    maxWidth: 420,
                    trim: true
                } 
            },
            legend: { 
                position: 'top', 
                horizontalAlign: 'left', 
                fontWeight: 600, 
                fontSize: '13px',
                itemMargin: { horizontal: 14, vertical: 6 },
                markers: { radius: 12, width: 10, height: 10 } 
            },
            dataLabels: { enabled: false },
            tooltip: { 
                theme: 'dark', 
                shared: true, 
                intersect: false, 
                y: { formatter: (val: any) => val + ' Forms' } 
            },
            grid: { borderColor: '#f1f5f9', strokeDashArray: 4, padding: { left: 20, right: 20 } }
        };
    }

    // 2. USER PERFORMANCE - Professional Leaderboard
    if (this.activeReport === 'USER_ADMISSION') {
        const chartData = [...data].sort((a, b) => (b.totalForms || 0) - (a.totalForms || 0)).slice(0, 12);
        
        this.barChartOptions = {
            series: [{ name: 'Total Forms', data: chartData.map(d => d.totalForms || 0) }],
            chart: { ...COMMON_CHART_OPTIONS, type: 'bar', height: 450 },
            plotOptions: {
                bar: {
                    columnWidth: '50%',
                    borderRadius: 12,
                    distributed: true,
                    dataLabels: { position: 'top' }
                }
            },
            colors: CHART_COLORS,
            xaxis: { 
                categories: chartData.map(d => d.courseName), // Backend sends userName in courseName field for this report
                labels: { rotate: -45, style: { colors: '#94a3b8', fontWeight: 700 } }
            },
            yaxis: { labels: { style: { colors: '#64748b', fontWeight: 600 } } },
            legend: { show: false },
            dataLabels: { enabled: false },
            fill: {
                type: 'gradient',
                gradient: { shade: 'light', type: 'vertical', shadeIntensity: 0.25, gradientToColors: undefined, inverseColors: true, opacityFrom: 0.85, opacityTo: 1, stops: [50, 0, 100] }
            },
            tooltip: { theme: 'light', y: { formatter: (val: any) => val + ' Forms Produced' } },
            grid: { show: false }
        };
    }

    // 3. REVENUE ANALYSIS - Advanced Multi-Visualizations
    if (this.activeReport === 'COURSE_REVENUE') {
        const chartData = data.slice(0, 12);
        
        this.revenueBarChartOptions = {
            series: [
                { name: 'Projected', data: chartData.map(d => d.totalRevenue || 0) },
                { name: 'Collected', data: chartData.map(d => d.totalFeesCollected || 0) },
                { name: 'Refunded', data: chartData.map(d => d.totalRefunded || 0) },
                { name: 'Net Collected', data: chartData.map(d => d.netCollected || 0) }
            ],
            chart: { ...COMMON_CHART_OPTIONS, type: 'bar', height: 450 },
            plotOptions: { bar: { columnWidth: '55%', borderRadius: 6 } },
            colors: ['#4f46e5', '#10b981', '#ef4444', '#3b82f6'], // Indigo, Emerald, Red, Blue
            xaxis: { categories: chartData.map(d => d.courseName), labels: { rotate: -45, style: { fontWeight: 600 } } },
            yaxis: { labels: { formatter: (val: any) => '₹' + val.toLocaleString() } },
            legend: { position: 'top', horizontalAlign: 'right' },
            dataLabels: { enabled: false },
            tooltip: { theme: 'light', y: { formatter: (val: any) => '₹' + val.toLocaleString() } }
        };

        const totalNetCollected = chartData.reduce((acc, d) => acc + (d.netCollected || 0), 0);
        const totalRefunded = chartData.reduce((acc, d) => acc + (d.totalRefunded || 0), 0);
        const totalProjected = chartData.reduce((acc, d) => acc + (d.totalRevenue || 0), 0);
        const totalRemaining = Math.max(0, totalProjected - totalNetCollected);

        this.revenueDonutChartOptions = {
            series: [totalNetCollected, totalRemaining, totalRefunded],
            labels: ['Net Collected', 'Remaining Revenue', 'Refunded'],
            chart: { ...COMMON_CHART_OPTIONS, type: 'donut', height: 350 },
            colors: ['#10b981', '#f59e0b', '#ef4444'], // Emerald, Amber, Red
            stroke: { width: 4, colors: ['#fff'] },
            legend: { position: 'bottom', fontWeight: 600, markers: { radius: 12 } },
            plotOptions: {
                pie: {
                    donut: {
                        size: '75%',
                        labels: {
                            show: true,
                            total: { 
                                show: true, 
                                label: 'OVERALL REVENUE', 
                                fontSize: '12px', 
                                fontWeight: 800, 
                                color: '#94a3b8',
                                formatter: () => '₹' + totalProjected.toLocaleString(undefined, { maximumFractionDigits: 0 })
                            },
                            value: { 
                                fontSize: '20px', 
                                fontWeight: 800, 
                                color: '#1e293b',
                                formatter: (val: any) => '₹' + Number(val).toLocaleString(undefined, { maximumFractionDigits: 0 })
                            }
                        }
                    }
                }
            },
            dataLabels: { enabled: false },
            tooltip: { 
                theme: 'light',
                y: { formatter: (val: any) => '₹' + val.toLocaleString() }
            }
        };

        this.revenueHorizontalBarChartOptions = {
            series: [
                { name: 'Confirmed Admissions', data: chartData.map(d => d.confirmedAdmissions || 0) }
            ],
            chart: { ...COMMON_CHART_OPTIONS, type: 'bar', height: Math.max(chartData.length * 40, 300) },
            plotOptions: {
                bar: {
                    horizontal: true,
                    barHeight: '60%',
                    borderRadius: 6,
                    dataLabels: { position: 'end' }
                }
            },
            colors: ['#3b82f6'], // Blue
            xaxis: { 
                categories: chartData.map(d => d.courseName),
                labels: { style: { fontWeight: 600 } }
            },
            yaxis: { labels: { style: { fontWeight: 600 } } },
            dataLabels: { 
                enabled: true,
                textAnchor: 'start',
                style: { colors: ['#fff'], fontWeight: 700 },
                formatter: (val: any) => val + ' Adms'
            },
            tooltip: { 
                theme: 'light',
                y: { formatter: (val: any) => val + ' Admissions' }
            },
            grid: { borderColor: '#f1f5f9', strokeDashArray: 4 }
        };
    }

    // 4. APPLICATION TRENDS - Smooth Area Chart
    if (this.activeReport === 'COURSE_ANALYTICS_APP') {
        const chartData = data.slice(0, 15);
        this.lineChartOptions = {
            series: [
                { name: 'Total Forms', data: chartData.map(d => d.totalForms || 0) },
                { name: 'Active Applications', data: chartData.map(d => d.totalRemainingApplications || 0) }
            ],
            chart: { ...COMMON_CHART_OPTIONS, type: 'area', height: 400 },
            stroke: { curve: 'smooth', width: 3 },
            colors: ['#435fff', '#fbbf24'],
            fill: { type: 'gradient', gradient: { opacityFrom: 0.45, opacityTo: 0.05 } },
            xaxis: { categories: chartData.map(d => d.courseName), labels: { rotate: -45 } },
            dataLabels: { enabled: false },
            markers: { size: 4, strokeWidth: 2, hover: { size: 6 } },
            tooltip: { theme: 'dark', x: { show: true } },
            grid: { borderColor: '#f1f5f9', strokeDashArray: 4 }
        };
    }

    // 5. GLOBAL DONUTS (Summary Views)
    if (this.getBaseReportType(this.activeReport) === 'COURSE_ANALYTICS' || 
        this.activeReport === 'LEAD_SOURCE_CONVERSION' || 
        this.activeReport === 'USER_ADMISSION') {
        let donutSeries: number[] = [];
        let donutLabels: string[] = [];
        let title = '';

        if (this.activeReport === 'LEAD_SOURCE_CONVERSION') {
            const lsTotals: { [key: string]: number } = {};
            data.forEach((d: any) => {
                d.leadSourceForms?.forEach((ls: any) => {
                    lsTotals[ls.leadSourceName] = (lsTotals[ls.leadSourceName] || 0) + ls.formCount;
                });
            });
            donutSeries = Object.values(lsTotals);
            donutLabels = Object.keys(lsTotals);
            title = 'SOURCE DISTRIBUTION';
        } else {
            const topData = data.slice(0, 8);
            donutSeries = topData.map(d => d.totalForms || 0);
            donutLabels = topData.map(d => d.courseName);
            title = 'PROGRAM VOLUME';
        }

        this.pieChartOptions = {
            series: donutSeries,
            labels: donutLabels,
            chart: { ...COMMON_CHART_OPTIONS, type: 'donut', height: 420 },
            colors: CHART_COLORS,
            stroke: { width: 4, colors: ['#fff'] },
            legend: { position: 'bottom', fontWeight: 600, markers: { radius: 12 } },
            plotOptions: {
                pie: {
                    donut: {
                        size: '85%',
                        labels: {
                            show: true,
                            total: { show: true, label: title, fontSize: '12px', fontWeight: 800, color: '#94a3b8' },
                            value: { fontSize: '24px', fontWeight: 800, color: '#1e293b' }
                        }
                    }
                }
            },
            dataLabels: { enabled: false },
            tooltip: { theme: 'dark' }
        };
    }

    // Default Fallback for other reports
    if (!this.barChartOptions && !this.pieChartOptions && !this.lineChartOptions) {
        // Simple Top 10 Bar for anything else
        const top10 = data.slice(0, 10);
        this.barChartOptions = {
            series: [{ name: 'Count', data: top10.map(d => d.totalForms || d.formCount || 0) }],
            chart: { ...COMMON_CHART_OPTIONS, type: 'bar', height: 350 },
            plotOptions: { bar: { columnWidth: '50%', borderRadius: 6 } },
            colors: ['#435fff'],
            xaxis: { categories: top10.map(d => d.courseName || d.studentName || 'N/A') }
        };
    }
  }

  private clearCharts() {
    this.barChartOptions = null;
    this.pieChartOptions = null;
    this.lineChartOptions = null;
    this.revenueBarChartOptions = null;
    this.revenueDonutChartOptions = null;
    this.revenueHorizontalBarChartOptions = null;
  }

  exportExcel() {
    this.reportsService.exportExcel(this.activeReport, this.filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CMS_Report_${this.activeReport}_${new Date().getTime()}.xlsx`;
        a.click();
      }
    });
  }

  exportWhatsApp() {
    this.reportsService.exportWhatsApp(this.activeReport, this.filters).subscribe({
      next: (res: any) => {
        // Debug logs to verify payload structure
        console.log('WhatsApp API Response:', res);
        
        // Structured mapping: response.data.whatsappMessage
        const reportContent = res.data?.whatsappMessage || res.data || res.message;
        
        if (reportContent && reportContent !== 'Success') {
          console.log('Generated Analytics Message (Length):', reportContent.length);
          const encoded = encodeURIComponent(reportContent);
          window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
        } else {
          console.error('WhatsApp report content is missing in payload:', res);
        }
      },
      error: (err) => {
        console.error('Failed to generate WhatsApp report:', err);
      }
    });
  }
}
