import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { InstitutionPageData, InstitutionItem, InstitutionStats, InstitutionDetail } from '../models/institution.model';

@Injectable({
  providedIn: 'root'
})
export class InstitutionService {
  private apiUrl = `${environment.apiUrl}/institutions`;

  constructor(private http: HttpClient) { }

  getInstitutionsData(): Observable<InstitutionPageData> {
    return forkJoin({
      institutionsRes: this.http.get<any>(this.apiUrl).pipe(catchError(() => of(null))),
      coursesRes: this.http.get<any>(`${environment.apiUrl}/courses`).pipe(catchError(() => of(null)))
    }).pipe(
      map(({ institutionsRes: response, coursesRes }) => {
        const institutionsData = Array.isArray(response) ? response : (response?.data || response?.content || (response ? [response] : []));
        const coursesData = Array.isArray(coursesRes) ? coursesRes : (coursesRes?.data || coursesRes?.content || (coursesRes ? [coursesRes] : []));
        
        let totalInstitutions = institutionsData.length;
        let activeInstitutions = 0;
        let totalCourses = coursesData.length;
        let totalStudents = 0;

        const mappedInstitutions: InstitutionItem[] = institutionsData.map((inst: any, index: number) => {
          const status = (typeof inst.status === 'string' && inst.status.toUpperCase() === 'ACTIVE') || inst.isActive ? 'Active' : 'Inactive';
          
          if (status === 'Active') activeInstitutions++;
          
          const studentsCount = inst.students || inst.studentCount || 0;
          totalStudents += studentsCount;

          let courseValue = inst.course || inst.courseCount || inst.courses?.length || 0;
          let courseDisplay = courseValue > 0 ? `${courseValue} Course` : 'No course';

          return {
            id: inst.id || index + 1,
            sNo: index + 1,
            name: inst.name || inst.institutionName || 'Unknown',
            code: inst.code || inst.institutionCode || 'N/A',
            students: studentsCount,
            status: status as 'Active' | 'Inactive',
            course: courseDisplay
          };
        });

        const stats: InstitutionStats = {
          totalInstitutions: totalInstitutions > 0 ? totalInstitutions : 7,
          activeInstitutions: activeInstitutions > 0 ? activeInstitutions : 6,
          totalCourses: totalCourses > 0 ? totalCourses : 259,
          totalStudents: totalStudents > 0 ? totalStudents : 7198
        };

        return { stats, institutions: mappedInstitutions, totalCount: totalInstitutions > 0 ? totalInstitutions : 1200 };
      }),
      catchError(err => {
        console.warn('Failed to load institution data, using mock fallback', err);
        return of(this.getMockData());
      })
    );
  }

  getInstitutionCourses(institutionId: number): Observable<any[]> {
    const url = `${this.apiUrl}/${institutionId}/courses`;
    return this.http.get<any>(url).pipe(
      map(res => {
        return Array.isArray(res) ? res : (res?.data || res?.content || (res ? [res] : []));
      }),
      catchError(err => {
        console.warn(`Failed to load courses for institution ${institutionId}, using mock data`, err);
        return of([
          { id: 1, name: 'B.Tech Computer Science' },
          { id: 2, name: 'BBA General' }
        ]);
      })
    );
  }

  getInstitutionDetail(id: number): Observable<InstitutionDetail> {
    const url = `${this.apiUrl}/${id}/detail`;
    return this.http.get<any>(url).pipe(
      map(res => res.data || res),
      catchError(err => {
        console.error(`Failed to load institution detail for ${id}`, err);
        throw err;
      })
    );
  }

  deleteInstitution(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  createInstitution(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  bulkUpload(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/bulk-upload`, formData);
  }

  downloadTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/bulk-upload/template`, { responseType: 'blob' });
  }

  private getMockData(): InstitutionPageData {
    const mockInstitutions: InstitutionItem[] = [
      { id: 1, sNo: 1, name: 'Manipal', code: 'MNU-101', students: 12, status: 'Active', course: '2 Course' },
      { id: 2, sNo: 2, name: 'Harvard', code: 'MD-103', students: 34, status: 'Active', course: '1 Course' },
      { id: 3, sNo: 3, name: 'Stanford', code: 'ENG-104', students: 56, status: 'Active', course: '2 Course' },
      { id: 4, sNo: 4, name: 'Yale', code: 'DS-105', students: 44, status: 'Active', course: 'No course' },
      { id: 5, sNo: 5, name: 'Princeton', code: 'AD-106', students: 120, status: 'Active', course: '3 Course' },
      { id: 6, sNo: 6, name: 'Johns Hopkins', code: 'LAW-107', students: 678, status: 'Active', course: '4 Course' },
      { id: 7, sNo: 7, name: 'NIT', code: 'PSY-108', students: 45, status: 'Active', course: '2 Course' },
      { id: 8, sNo: 8, name: 'Manipal', code: 'AD-107', students: 89, status: 'Active', course: 'No course' },
      { id: 9, sNo: 9, name: 'GSITS', code: 'PSY-109', students: 32, status: 'Active', course: '6 Course' },
      { id: 10, sNo: 10, name: 'IIT', code: 'CS-102', students: 90, status: 'Active', course: '1 Course' }
    ];

    return {
      stats: {
        totalInstitutions: 7,
        activeInstitutions: 6,
        totalCourses: 259,
        totalStudents: 7198
      },
      institutions: mockInstitutions,
      totalCount: 1200
    };
  }
}
