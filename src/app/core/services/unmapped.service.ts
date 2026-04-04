import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UnmappedService {
  private apiUrl = `${environment.apiUrl}/unmapped`;
  private exportUrl = `${environment.apiUrl}/export/unmapped`;

  constructor(private http: HttpClient) { }

  getUnmappedStudents(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/students`);
  }

  getUnmappedUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`);
  }

  getUnmappedCourses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/courses`);
  }

  getConsultanciesWithoutUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/consultancies/without-users`);
  }

  getConsultanciesWithoutCourses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/consultancies/without-courses`);
  }

  exportToExcel(type: string, columns: string[]): Observable<Blob> {
    let params = new HttpParams();
    columns.forEach(col => params = params.append('columns', col));

    return this.http.get(`${this.exportUrl}/${type}`, {
      params,
      responseType: 'blob'
    });
  }
}
