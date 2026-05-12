import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsService, ReportFilter } from '../../core/services/reports.service';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { finalize } from 'rxjs';
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
};

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent, NgApexchartsModule],
  providers: [DecimalPipe],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit {
  private reportsService = inject(ReportsService);

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
    search: ''
  };

  sessions = ['2023', '2024', '2025', '2026', '2027'];
  
  // Chart configs
  public barChartOptions: Partial<ChartOptions> | any;
  public pieChartOptions: Partial<ChartOptions> | any;
  public lineChartOptions: Partial<ChartOptions> | any;

  get filteredReportData() {
    if (!this.reportData) return [];
    
    let data = this.reportData;

    // Specific filter for Lead Source Matrix: Exclude zero counts
    if (this.activeReport === 'COURSE_LEAD_SOURCE') {
      data = data.filter(item => {
        // Check if any lead source has forms OR if totalForms is > 0
        const leadCount = item.leadSources?.reduce((acc: number, curr: any) => acc + (curr.formsReceived || 0), 0) || 0;
        const totalForms = item.totalForms || 0;
        return leadCount > 0 || totalForms > 0;
      });
    }

    if (!this.filters.search) return data;
    
    const term = this.filters.search.toLowerCase();
    return data.filter(item => 
      item.courseName?.toLowerCase().includes(term) ||
      item.studentName?.toLowerCase().includes(term) ||
      item.userName?.toLowerCase().includes(term) ||
      item.enrollmentNumber?.toLowerCase().includes(term)
    );
  }

  get paginatedData() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredReportData.slice(start, start + this.pageSize);
  }

  get totalPages() {
    return Math.ceil(this.filteredReportData.length / this.pageSize);
  }

  nextPage() { 
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevPage() { 
    if (this.currentPage > 1) {
      this.currentPage--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  setPage(p: number) { this.currentPage = p; }

  onPageSizeChange() { 
    this.pageSize = Number(this.pageSize);
    this.currentPage = 1; 
  }

  get summaryStats() {
    const data = this.filteredReportData;
    if (!data || !data.length) return { total: 0, secondary: 0, tertiary: 0, quaternary: 0 };

    const totals = this.totalsRow;
    if (!totals) return { total: 0, secondary: 0, tertiary: 0, quaternary: 0 };

    if (this.activeReport.includes('ANALYTICS') || this.activeReport === 'COURSE_SUMMARY' || this.activeReport === 'COURSE_REVENUE' || this.activeReport === 'DAILY_FEES') {
      return {
        total: totals.totalForms,
        secondary: totals.totalConfirmed,
        tertiary: totals.totalFeesCollected,
        quaternary: totals.totalRemaining
      };
    }
    
    if (this.activeReport === 'STUDENT_DETAIL') {
      return {
        total: data.length,
        secondary: data.filter(s => s.fiftyPercentFeesPaid).length,
        tertiary: totals.totalFeesPaid,
        quaternary: totals.totalRemainingFees
      }
    }

    return {
        total: totals.totalForms,
        secondary: totals.totalConfirmed,
        tertiary: totals.totalFeesCollected,
        quaternary: totals.totalRemaining
    };
  }

  get totalsRow() {
    const data = this.filteredReportData;
    if (!data || !data.length) return null;

    const row: any = {
        totalForms: 0,
        totalConfirmed: 0,
        totalCancelled: 0,
        totalPaid50: 0,
        totalFeesCollected: 0,
        totalRemaining: 0,
        totalFeesPaid: 0,
        totalRemainingFees: 0,
        totalFees: 0,
        leadSourceTotals: [],
        totalStudents: data.length
    };

    data.forEach(item => {
        row.totalForms += (item.totalForms || 0);
        row.totalConfirmed += (item.totalConfirmedAdmissions || 0);
        row.totalCancelled += (item.totalCancelledAdmissions || 0);
        row.totalPaid50 += (item.paid50PercentFees || 0);
        row.totalFeesCollected += (item.totalFeesCollected || 0);
        row.totalRemaining += (item.remainingAmount || 0);
        row.totalFeesPaid += (item.totalFeesPaid || 0);
        row.totalRemainingFees += (item.remainingFees || 0);
        row.totalFees += (item.totalFees || 0);
    });

    if (this.activeReport === 'COURSE_LEAD_SOURCE') {
        const lsMap: {[key: string]: number} = {};
        data.forEach(d => {
            if (d.leadSources) {
                d.leadSources.forEach((ls: any) => {
                    lsMap[ls.leadSourceName] = (lsMap[ls.leadSourceName] || 0) + ls.formsReceived;
                });
            }
        });
        row.leadSourceTotals = this.leadSourceHeaders.map(h => lsMap[h] || 0);
    }

    // Revenue totals for Analytics
    row.totalRevenue = data.reduce((acc, curr) => acc + (curr.totalRevenue || 0), 0);

    return row;
  }

  getLeadVal(d: any, h: string): number {
    if (!d.leadSources) return 0;
    const stat = d.leadSources.find((s: any) => s.leadSourceName === h);
    return stat ? stat.formsReceived : 0;
  }

  reportTypes = [
    { id: 'COURSE_LEAD_SOURCE', label: 'Lead Source Matrix', icon: 'grid_view', desc: 'Course-wise lead source distribution', color: 'indigo' },
    { id: 'USER_ADMISSION', label: 'User Performance', icon: 'person_search', desc: 'Counselor-wise form volume', color: 'purple' },
    { id: 'COURSE_REVENUE', label: 'Revenue Analysis', icon: 'payments', desc: 'Fees collection vs pending dues', color: 'emerald' },
    { id: 'COURSE_ANALYTICS_APP', label: 'Application Trends', icon: 'description', desc: 'Form volume and status tracking', color: 'blue' },
    { id: 'COURSE_ANALYTICS_ADMISSION', label: 'Admission Metrics', icon: 'how_to_reg', desc: 'Confirmed vs cancelled adms', color: 'rose' },
    { id: 'DAILY_FEES', label: 'Daily Collection', icon: 'account_balance_wallet', desc: 'Real-time financial tracking', color: 'cyan' },
    { id: 'LEAD_SOURCE_CONVERSION', label: 'Lead Conversion', icon: 'query_stats', desc: 'Conversion rate by source', color: 'amber' },
    { id: 'COURSE_SUMMARY', label: 'Program Summary', icon: 'summarize', desc: 'Full academic year overview', color: 'slate' },
    { id: 'STUDENT_DETAIL', label: 'Student Thresholds', icon: 'group', desc: '50% fee payment status', color: 'violet' }
  ];

  ngOnInit() {
    this.loadReport();
  }

  setReport(type: string) {
    this.activeReport = type;
    this.reportData = [];
    this.barChartOptions = null;
    this.pieChartOptions = null;
    this.lineChartOptions = null;
    this.loadReport();
  }

  loadReport() {
    this.loading = true;
    
    let obs;
    const baseType = this.getBaseReportType(this.activeReport);

    switch (baseType) {
      case 'COURSE_ANALYTICS':
        obs = this.reportsService.getCourseAnalyticsReport(this.filters);
        break;
      case 'COURSE_LEAD_SOURCE':
        obs = this.reportsService.getCourseLeadSourceReport(this.filters);
        break;
      case 'LEAD_SOURCE_CONVERSION':
        obs = this.reportsService.getLeadSourceConversionReport(this.filters);
        break;
      case 'USER_ADMISSION':
        obs = this.reportsService.getUserAdmissionReport(this.filters);
        break;
      case 'STUDENT_DETAIL':
        obs = this.reportsService.getStudentDetailReport(this.filters);
        break;
    }

    if (obs) {
      obs.pipe(finalize(() => this.loading = false)).subscribe({
        next: (res: any) => {
          this.reportData = res.data || res || [];
          
          if (this.activeReport === 'USER_ADMISSION') {
            this.reportData = this.reportData.filter(d => (d.totalForms || 0) > 0);
          }

          if (baseType === 'COURSE_LEAD_SOURCE' && this.reportData.length > 0 && this.reportData[0].leadSources) {
            this.leadSourceHeaders = this.reportData[0].leadSources.map((ls: any) => ls.leadSourceName);
          }
          this.initCharts();
        },
        error: (err) => {
          console.error('Error loading report', err);
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
    return type;
  }

  private initCharts() {
    if (!this.reportData || this.reportData.length === 0) {
      this.barChartOptions = null;
      this.pieChartOptions = null;
      this.lineChartOptions = null;
      return;
    }

    const hasForms = this.reportData.some(d => (d.totalForms || 0) > 0);
    const hasConfirmed = this.reportData.some(d => (d.totalConfirmedAdmissions || 0) > 0);

    if (!hasForms && !hasConfirmed && this.activeReport !== 'STUDENT_DETAIL') {
        this.barChartOptions = null;
        this.pieChartOptions = null;
        this.lineChartOptions = null;
        return;
    }

    const data = this.filteredReportData;
    const labels = data.map(d => {
        const name = d.courseName || d.studentName || 'N/A';
        return name.length > 25 ? name.substring(0, 22) + '...' : name;
    });
    const colors = ['#4f46e5', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];
    const dynamicHeight = Math.max(350, data.length * 35);

    if (this.activeReport === 'COURSE_LEAD_SOURCE') {
      const series = this.leadSourceHeaders.map(ls => ({
        name: ls,
        data: data.map(d => {
          const stat = d.leadSources?.find((s: any) => s.leadSourceName === ls);
          return stat ? stat.formsReceived : 0;
        })
      }));

      this.barChartOptions = {
        series: series,
        chart: { type: 'bar', height: dynamicHeight, stacked: true, toolbar: { show: false }, animations: { enabled: false } },
        plotOptions: { bar: { horizontal: true, barHeight: '80%', borderRadius: 4 } },
        xaxis: { categories: labels, labels: { style: { fontSize: '10px', fontWeight: 600 } }, axisBorder: { show: false } },
        yaxis: { labels: { show: true, style: { fontSize: '11px', fontWeight: 600, colors: ['#475569'] }, maxWidth: 200 } },
        grid: { padding: { left: 20, right: 20 }, borderColor: '#f1f5f9' },
        colors: colors,
        legend: { position: 'top', horizontalAlign: 'right', fontSize: '12px', fontWeight: 600 },
        dataLabels: { enabled: false }
      };
    }

    if (this.activeReport === 'USER_ADMISSION') {
      const allUsers = new Set<string>();
      data.forEach(d => d.userContributions?.forEach((u: any) => allUsers.add(u.userName)));
      const userList = Array.from(allUsers);

      const series = userList.map(user => ({
          name: user,
          data: data.map(d => {
            const contrib = d.userContributions?.find((u: any) => u.userName === user);
            return contrib ? contrib.formCount : 0;
          })
      }));

      this.barChartOptions = {
        series: series,
        chart: { type: 'bar', height: dynamicHeight, stacked: true, toolbar: { show: false }, animations: { enabled: false } },
        plotOptions: { bar: { horizontal: true, barHeight: '80%', borderRadius: 4 } },
        xaxis: { categories: labels, labels: { style: { fontSize: '10px', fontWeight: 600 } }, axisBorder: { show: false } },
        yaxis: { labels: { show: true, style: { fontSize: '11px', fontWeight: 600, colors: ['#475569'] }, maxWidth: 200 } },
        grid: { padding: { left: 20, right: 20 }, borderColor: '#f1f5f9' },
        colors: colors,
        legend: { position: 'top', horizontalAlign: 'right', fontSize: '12px', fontWeight: 600 }
      };
    }

    if (this.getBaseReportType(this.activeReport) === 'COURSE_ANALYTICS') {
        this.pieChartOptions = {
            series: data.slice(0, 10).map(d => d.totalForms || 0),
            chart: { type: 'donut', height: 400 },
            labels: labels.slice(0, 10),
            colors: colors,
            legend: { position: 'bottom', fontSize: '12px' },
            dataLabels: { enabled: true, formatter: (val: any) => val.toFixed(1) + "%" },
            plotOptions: { pie: { donut: { size: '75%', labels: { show: true, total: { show: true, label: 'TOTAL FORMS', fontSize: '12px', fontWeight: 800 } } } } }
        };

        this.lineChartOptions = {
            series: [
                { name: 'Confirmed Admissions', data: data.map(d => d.totalConfirmedAdmissions || 0) },
                { name: 'Form Submissions', data: data.map(d => d.totalForms || 0) }
            ],
            chart: { type: 'area', height: 400, toolbar: { show: false } },
            xaxis: { categories: labels, labels: { rotate: -45, style: { fontSize: '10px' } } },
            colors: ['#10b981', '#4f46e5'],
            stroke: { curve: 'smooth', width: 3 },
            fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05 } },
            dataLabels: { enabled: false }
        };
    }

    if (this.activeReport === 'LEAD_SOURCE_CONVERSION') {
        const lsTotals: { [key: string]: number } = {};
        data.forEach(d => {
            d.leadSourceForms?.forEach((ls: any) => {
                lsTotals[ls.leadSourceName] = (lsTotals[ls.leadSourceName] || 0) + ls.formCount;
            });
        });

        this.pieChartOptions = {
            series: Object.values(lsTotals),
            labels: Object.keys(lsTotals),
            chart: { type: 'donut', height: 400 },
            colors: colors,
            legend: { position: 'bottom' },
            plotOptions: { pie: { donut: { labels: { show: true, total: { show: true, label: 'LEAD SOURCES' } } } } }
        };
    }

    if (this.activeReport === 'STUDENT_DETAIL') {
        const paid = data.filter(s => s.fiftyPercentFeesPaid).length;
        const unpaid = data.length - paid;
        this.pieChartOptions = {
            series: [paid, unpaid],
            labels: ['Threshold Met (50%+)', 'Payment Pending'],
            chart: { type: 'donut', height: 400 },
            colors: ['#10b981', '#f59e0b'],
            legend: { position: 'bottom' },
            plotOptions: { pie: { donut: { labels: { show: true, total: { show: true, label: 'PAYMENT STATUS' } } } } }
        };
    }
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
        const text = encodeURIComponent(res.message || res.data || res);
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
      }
    });
  }
}

