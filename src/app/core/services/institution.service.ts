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
            course: courseDisplay,
            deleted: inst.deleted || false,
            totalAdmissions: inst.totalAdmissions || 0,
            totalApplications: inst.totalApplications || 0,
            cancelledAdmissions: inst.cancelledAdmissions || 0,
            cancelledApplications: inst.cancelledApplications || 0
          };
        });

        const stats: InstitutionStats = {
          totalInstitutions: totalInstitutions > 0 ? totalInstitutions : 0,
          activeInstitutions: activeInstitutions > 0 ? activeInstitutions : 0,
          totalCourses: totalCourses > 0 ? totalCourses : 0,
          totalStudents: totalStudents > 0 ? totalStudents : 0
        };

        return { stats, institutions: mappedInstitutions, totalCount: totalInstitutions > 0 ? totalInstitutions : 0 };
      }),
      catchError(err => {
        console.warn('Failed to load institution data, using mock fallback', err);
        return of(this.getMockData());
      })
    );
  }

  getInstitutionsByStatus(status: string): Observable<InstitutionPageData> {
    return forkJoin({
      institutionsRes: this.http.get<any>(`${this.apiUrl}/status/${status.toUpperCase()}`).pipe(catchError(() => of(null))),
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
          const instStatus = (typeof inst.status === 'string' && inst.status.toUpperCase() === 'ACTIVE') || inst.isActive ? 'Active' : 'Inactive';

          if (instStatus === 'Active') activeInstitutions++;

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
            status: instStatus as 'Active' | 'Inactive',
            course: courseDisplay,
            deleted: inst.deleted || false,
            totalAdmissions: inst.totalAdmissions || 0,
            totalApplications: inst.totalApplications || 0,
            cancelledAdmissions: inst.cancelledAdmissions || 0,
            cancelledApplications: inst.cancelledApplications || 0
          };
        });

        const stats: InstitutionStats = {
          totalInstitutions: totalInstitutions > 0 ? totalInstitutions : 0,
          activeInstitutions: activeInstitutions > 0 ? activeInstitutions : 0,
          totalCourses: totalCourses > 0 ? totalCourses : 0,
          totalStudents: totalStudents > 0 ? totalStudents : 0
        };

        return { stats, institutions: mappedInstitutions, totalCount: totalInstitutions > 0 ? totalInstitutions : 0 };
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

  getInstitutionById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data || res)
    );
  }

  createInstitution(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  updateInstitution(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  restoreRecord(id: number, type: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/restore/${id}?type=${type}`, {});
  }

  deletePermanent(id: number, type: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/permanent/${id}?type=${type}`);
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
