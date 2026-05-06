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

  getUnmappedStudents(page: number = 0, size: number = 10, search: string = ''): Observable<any> {
    const params = new HttpParams().set('page', page).set('size', size).set('search', search);
    return this.http.get<any>(`${this.apiUrl}/students`, { params });
  }

  getUnmappedUsers(page: number = 0, size: number = 10, search: string = ''): Observable<any> {
    const params = new HttpParams().set('page', page).set('size', size).set('search', search);
    return this.http.get<any>(`${this.apiUrl}/users`, { params });
  }

  getUnmappedCourses(page: number = 0, size: number = 10, search: string = ''): Observable<any> {
    const params = new HttpParams().set('page', page).set('size', size).set('search', search);
    return this.http.get<any>(`${this.apiUrl}/courses`, { params });
  }

  getConsultanciesWithoutUsers(page: number = 0, size: number = 10, search: string = ''): Observable<any> {
    const params = new HttpParams().set('page', page).set('size', size).set('search', search);
    return this.http.get<any>(`${this.apiUrl}/consultancy-users`, { params });
  }

  getConsultanciesWithoutCourses(page: number = 0, size: number = 10, search: string = ''): Observable<any> {
    const params = new HttpParams().set('page', page).set('size', size).set('search', search);
    return this.http.get<any>(`${this.apiUrl}/consultancy-courses`, { params });
  }

  exportToExcel(type: string, columns: string[]): Observable<Blob> {
    let params = new HttpParams();
    columns.forEach(col => params = params.append('columns', col));

    return this.http.get(`${this.exportUrl}/${type}`, {
      params,
      responseType: 'blob'
    });
  }

  mapStudent(id: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/map/student`, { id, type: 'students', data });
  }

  mapUser(id: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/map/user`, { id, type: 'users', data });
  }

  mapCourse(id: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/map/course`, { id, type: 'courses', data });
  }

  mapConsultancyUsers(id: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/map/consultancy/users`, { id, type: 'consultancies-users', data });
  }

  mapConsultancyCourses(id: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/map/consultancy/courses`, { id, type: 'consultancies-courses', data });
  }
}
