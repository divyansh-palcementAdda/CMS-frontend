import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CourseDTO, CourseDetail, CourseItem, CoursePageData, CourseStats, CreateCourseDTO, BulkUploadResponse } from '../models/course.model';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = `${environment.apiUrl}/courses`;

  constructor(private http: HttpClient) { }

  getCourseDetail(id: number): Observable<CourseDetail> {
    return this.http.get<any>(`${this.apiUrl}/${id}/detail`).pipe(
      map(response => response.data)
    );
  }

  getCoursesData(): Observable<CoursePageData> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => this.transformCoursePageData(response)),
      catchError(err => {
        console.error('Failed to load courses data', err);
        return of({ stats: { totalCourses: 0, activeCourses: 0, offlineCourses: 0, totalStudents: 0 }, courses: [], totalCount: 0 });
      })
    );
  }

  getCoursesByType(typeId: number): Observable<CoursePageData> {
    return this.http.get<any>(`${this.apiUrl}/type/${typeId}`).pipe(
      map(response => this.transformCoursePageData(response)),
      catchError(err => {
        console.error(`Failed to load courses for type ${typeId}`, err);
        return of({ stats: { totalCourses: 0, activeCourses: 0, offlineCourses: 0, totalStudents: 0 }, courses: [], totalCount: 0 });
      })
    );
  }

  getCoursesByActive(active: boolean): Observable<CoursePageData> {
    return this.http.get<any>(`${this.apiUrl}/active/${active}`).pipe(
      map(response => this.transformCoursePageData(response)),
      catchError(err => {
        console.error(`Failed to load courses with active=${active}`, err);
        return of({ stats: { totalCourses: 0, activeCourses: 0, offlineCourses: 0, totalStudents: 0 }, courses: [], totalCount: 0 });
      })
    );
  }

  private transformCoursePageData(response: any): CoursePageData {
    const coursesData = Array.isArray(response) ? response : (response?.data || response?.content || []);

    let activeCourses = 0;
    let offlineCourses = 0;
    let totalStudents = 0;

    const mappedCourses: CourseItem[] = coursesData.map((course: CourseDTO, index: number) => {
      const isActive = course.active !== false;
      if (isActive) activeCourses++;
      if (!course.isOnline) offlineCourses++;

      const studentsCount = course.studentCount || 0;
      totalStudents += studentsCount;

      const instCount = course.institutionCount || 0;
      const hasInstitutions = instCount > 0;
      const institutionsText = hasInstitutions ? `${instCount} Institution${instCount > 1 ? 's' : ''}` : 'No Institutions';

      return {
        id: course.id || 0,
        sNo: index + 1,
        name: course.name || 'N/A',
        courseType: course.courseTypeName || 'N/A',
        duration: course.duration ? `${course.duration} yrs` : 'N/A',
        students: studentsCount,
        status: isActive ? 'Active' : 'Inactive',
        institutionCount: instCount,
        institutionsText,
        hasInstitutions
      };
    });

    const stats: CourseStats = {
      totalCourses: coursesData.length,
      activeCourses,
      offlineCourses,
      totalStudents
    };

    return { stats, courses: mappedCourses, totalCount: coursesData.length };
  }

  deleteCourse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateCourse(id: number | string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  getAllCourses(): Observable<any[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => Array.isArray(response) ? response : (response?.data || response?.content || []))
    );
  }

  createCourse(data: CreateCourseDTO): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  bulkUpload(file: File): Observable<BulkUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<BulkUploadResponse>(`${this.apiUrl}/bulk-upload`, formData);
  }

  downloadTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/bulk-upload/template`, {
      responseType: 'blob'
    });
  }
}
