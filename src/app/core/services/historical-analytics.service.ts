import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReportFilter } from './reports.service';

@Injectable({
  providedIn: 'root'
})
export class HistoricalAnalyticsService {
  private apiUrl = `${environment.apiUrl}/historical-course-analytics`;

  constructor(private http: HttpClient) { }

  searchHistoricalAnalytics(filter: ReportFilter): Observable<any> {
    return this.http.post(`${this.apiUrl}/query`, filter);
  }

  createHistoricalAnalytics(request: any): Observable<any> {
    return this.http.post(this.apiUrl, request);
  }

  updateHistoricalAnalytics(id: number, request: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, request);
  }

  deleteHistoricalAnalytics(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getUniqueSessions(): Observable<any> {
    return this.http.get(`${this.apiUrl}/sessions`);
  }

  downloadTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/template`, { responseType: 'blob' });
  }

  uploadExcel(file: File, session: string, dataType: string, remarks: string, uploadMode: string = 'UPSERT'): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('session', session);
    formData.append('dataType', dataType);
    formData.append('uploadMode', uploadMode);
    if (remarks) {
      formData.append('remarks', remarks);
    }
    return this.http.post(`${this.apiUrl}/upload`, formData);
  }

  getUploadJobStatus(jobId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/upload/status/${jobId}`);
  }
}
