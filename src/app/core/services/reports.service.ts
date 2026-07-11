import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  session?: string;
  filterType?: 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'THIS_YEAR' | 'ALL_TIME' | 'CUSTOM' | 'CUSTOM_DATE' | 'CUSTOM_DATE_TIME';
  search?: string;
  startDateTime?: string;
  endDateTime?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
  sortDirection?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) { }

  getCourseLeadSourceReport(filter: ReportFilter): Observable<any> {
    return this.http.post(`${this.apiUrl}/course-lead-source`, filter);
  }

  getUserAdmissionReport(filter: ReportFilter): Observable<any> {
    return this.http.post(`${this.apiUrl}/user-admission`, filter);
  }

  getCourseAnalyticsReport(filter: ReportFilter): Observable<any> {
    return this.http.post(`${this.apiUrl}/course-analytics`, filter);
  }

  getCourseRevenueReport(filter: ReportFilter): Observable<any> {
    return this.http.post(`${this.apiUrl}/course-revenue`, filter);
  }

  getLeadSourceConversionReport(filter: ReportFilter): Observable<any> {
    return this.http.post(`${this.apiUrl}/lead-source-conversion`, filter);
  }

  getStudentDetailReport(filter: ReportFilter): Observable<any> {
    return this.http.post(`${this.apiUrl}/student-detail`, filter);
  }

  getDailySessionSummaryReport(filter: ReportFilter): Observable<any> {
    return this.http.post(`${this.apiUrl}/daily-session-summary`, filter);
  }

  getCourseTargetAchievementReport(filter: ReportFilter): Observable<any> {
    return this.http.post(`${this.apiUrl}/course-target-achievement`, filter);
  }

  exportExcel(type: string, filter: ReportFilter): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/export/excel?type=${type}`, filter, { responseType: 'blob' });
  }

  exportWhatsApp(type: string, filter: ReportFilter): Observable<any> {
    return this.http.post(`${this.apiUrl}/export/whatsapp?type=${type}`, filter);
  }

  getSessionCumulativeStats(session: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/session/cumulative-stats`, { params: { session } });
  }

  getSessionComparisonReport(prevSession: string, currSession: string, filter: ReportFilter): Observable<any> {
    return this.http.post(`${this.apiUrl}/session-comparison?prevSession=${prevSession}&currSession=${currSession}`, filter);
  }

  getSchedulerConfig(): Observable<any> {
    return this.http.get(`${this.apiUrl}/scheduler-config`);
  }

  updateSchedulerConfig(config: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/scheduler-config`, config);
  }

  backfillHistory(filter: ReportFilter): Observable<any> {
    return this.http.post(`${this.apiUrl}/course-target-achievement/backfill`, filter);
  }
}
