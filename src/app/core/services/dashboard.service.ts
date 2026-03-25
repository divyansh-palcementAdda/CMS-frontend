import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResult, DashboardData, DashboardStats, CommissionData, ChartData
} from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly base = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  private asNumber(value: unknown): number {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  private normalizeCharts(raw: any): ChartData {
    const d: any = raw ?? {};

    const yearlyAdmissions = Array.isArray(d.yearlyAdmissions)
      ? d.yearlyAdmissions.map((y: any) => ({
          year: String(y?.year ?? ''),
          admissions: this.asNumber(y?.admissions ?? y?.count)
        }))
      : undefined;

    const weeklyAdmissions = Array.isArray(d.weeklyAdmissions)
      ? d.weeklyAdmissions.map((w: any) => ({
          week: String(w?.week ?? w?.weekLabel ?? ''),
          admissions: this.asNumber(w?.admissions ?? w?.count)
        }))
      : undefined;

    const monthlyAdmissions = Array.isArray(d.monthlyAdmissions)
      ? d.monthlyAdmissions.map((m: any) => ({
          month: String(m?.month ?? ''),
          admissions: this.asNumber(m?.admissions ?? m?.count)
        }))
      : undefined;

    const targetVsAchieved = Array.isArray(d.targetVsAchieved)
      ? d.targetVsAchieved.map((t: any) => ({
          category: String(t?.category ?? t?.month ?? ''),
          target: this.asNumber(t?.target),
          achieved: this.asNumber(t?.achieved)
        }))
      : undefined;

    const feesStatus = Array.isArray(d.feesStatus)
      ? d.feesStatus.map((p: any) => ({ name: String(p?.name ?? ''), value: this.asNumber(p?.value) }))
      : d.feesStatus && typeof d.feesStatus === 'object'
        ? [
            { name: 'Paid', value: this.asNumber(d.feesStatus?.paidCount) },
            { name: 'Unpaid', value: this.asNumber(d.feesStatus?.unpaidCount) }
          ]
        : undefined;

    const completionStatus = Array.isArray(d.completionStatus)
      ? d.completionStatus.map((p: any) => ({ name: String(p?.name ?? ''), value: this.asNumber(p?.value) }))
      : d.completionStatus && typeof d.completionStatus === 'object'
        ? (() => {
            const completed = this.asNumber(d.completionStatus?.completedCount);
            const total = this.asNumber(d.completionStatus?.totalCount);
            const pending = Math.max(0, total - completed);
            return [
              { name: 'Completed', value: completed },
              { name: 'Pending', value: pending }
            ];
          })()
        : undefined;

    const tokenAmountStats = Array.isArray(d.tokenAmountStats)
      ? d.tokenAmountStats.map((t: any) => ({
          name: String(t?.name ?? t?.category ?? ''),
          value: this.asNumber(t?.value ?? t?.totalAmount)
        }))
      : undefined;

    const topConsultancies = Array.isArray(d.topConsultancies)
      ? d.topConsultancies.map((t: any) => ({
          admissionCount: this.asNumber(t?.admissionCount),
          consultancyName: String(t?.consultancyName ?? '')
        }))
      : undefined;

    const consultancyVsCourse = Array.isArray(d.consultancyVsCourse)
      ? d.consultancyVsCourse.map((r: any) => ({
          name: String(r?.name ?? ''),
          consultancy: this.asNumber(r?.consultancy),
          courses: this.asNumber(r?.courses)
        }))
      : undefined;

    return {
      yearlyAdmissions,
      weeklyAdmissions,
      monthlyAdmissions,
      targetVsAchieved,
      feesStatus,
      completionStatus,
      tokenAmountStats,
      consultancyVsCourse,
      topConsultancies
    } as ChartData;
  }

  getDashboard(): Observable<DashboardData> {
    return this.http.get<ApiResult<DashboardData>>(this.base).pipe(
      map(r => r?.data ?? (r as unknown as DashboardData)),
      catchError(err => { console.error('[Dashboard] getDashboard failed', err); return of({} as DashboardData); })
    );
  }

  getStats(): Observable<DashboardStats> {
    return this.http.get<ApiResult<DashboardStats>>(`${this.base}/stats`).pipe(
      map(r => r?.data ?? (r as unknown as DashboardStats)),
      catchError(err => { console.error('[Dashboard] getStats failed', err); return of({} as DashboardStats); })
    );
  }

  getCommission(): Observable<CommissionData> {
    return this.http.get<ApiResult<CommissionData>>(`${this.base}/commission`).pipe(
      map(r => r?.data ?? (r as unknown as CommissionData)),
      catchError(err => { console.error('[Dashboard] getCommission failed', err); return of({} as CommissionData); })
    );
  }

  getCharts(): Observable<ChartData> {
    return this.http.get<ApiResult<ChartData>>(`${this.base}/charts`).pipe(
      map(r => this.normalizeCharts(r?.data ?? (r as unknown as any))),
      catchError(err => { console.error('[Dashboard] getCharts failed', err); return of({} as ChartData); })
    );
  }

  loadAll(): Observable<{
    dashboard: DashboardData;
    stats: DashboardStats;
    commission: CommissionData;
    charts: ChartData;
  }> {
    return forkJoin({
      dashboard: this.getDashboard(),
      stats:     this.getStats(),
      commission: this.getCommission(),
      charts:    this.getCharts()
    });
  }
}
