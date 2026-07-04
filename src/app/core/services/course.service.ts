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

  getCourseById(id: number): Observable<CourseDTO> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  getCourseStudentsPaged(id: number, page: number, size: number, tab: string, search: string, source: string, scholar: boolean | null, sortBy: string, sortDirection: string): Observable<any> {
    let params: any = { page: page.toString(), size: size.toString(), tab, sortBy, sortDirection };
    if (search) params.search = search;
    if (source) params.source = source;
    if (scholar !== null) params.scholar = scholar.toString();
    return this.http.get<any>(`${this.apiUrl}/${id}/students/paged`, { params }).pipe(map(res => res.data));
  }

  getCourseConsultanciesPaged(id: number, page: number, size: number, search: string, sortBy: string, sortDirection: string): Observable<any> {
    let params: any = { page: page.toString(), size: size.toString(), sortBy, sortDirection };
    if (search) params.search = search;
    return this.http.get<any>(`${this.apiUrl}/${id}/consultancies/paged`, { params }).pipe(map(res => res.data));
  }

  getCourseInstitutionsPaged(id: number, page: number, size: number, search: string, sortBy: string, sortDirection: string): Observable<any> {
    let params: any = { page: page.toString(), size: size.toString(), sortBy, sortDirection };
    if (search) params.search = search;
    return this.http.get<any>(`${this.apiUrl}/${id}/institutions/paged`, { params }).pipe(map(res => res.data));
  }

  exportCourseStudentsExcel(id: number, tab: string, search: string, source: string, scholar: boolean | null): Observable<Blob> {
    let params: any = { tab };
    if (search) params.search = search;
    if (source) params.source = source;
    if (scholar !== null) params.scholar = scholar.toString();
    
    return this.http.get(`${this.apiUrl}/${id}/students/export`, { params, responseType: 'blob' });
  }

  getCoursesData(filters?: { feeFilter?: string, startDate?: string, endDate?: string, session?: string }): Observable<CoursePageData> {
    let params: any = {};
    if (filters) {
      if (filters.feeFilter) params.feeFilter = filters.feeFilter;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.session) params.session = filters.session;
    }
    return this.http.get<any>(this.apiUrl, { params }).pipe(
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
        hasInstitutions,
        totalApplications: course.totalApplications || 0,
        remainingApplications: course.remainingApplications || 0,
        totalAdmissions: course.totalAdmissions || 0,
        cancelledApplications: course.cancelledApplications || 0,
        cancelledAdmissions: course.cancelledAdmissions || 0,
        totalFeesCollected: course.totalFeesCollected || 0
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

  getCoursesPaged(
    page: number,
    size: number,
    search: string = '',
    active: boolean | null = null,
    sortBy: string = 'name',
    sortDirection: string = 'asc'
  ): Observable<{ content: CourseItem[], totalElements: number, totalPages: number, stats: CourseStats }> {
    let params = `?page=${page}&size=${size}&sortBy=${sortBy}&sortDirection=${sortDirection}`;
    if (search) params += `&search=${encodeURIComponent(search)}`;
    if (active !== null) params += `&active=${active}`;

    return this.http.get<any>(`${this.apiUrl}/paged${params}`).pipe(
      map(res => {
        const pagedData = res.data || res;
        const rawContent = pagedData.content || [];
        const content = rawContent.map((c: any, i: number) => {
          const isActive = c.active !== false;
          const instCount = c.institutionCount || 0;
          const hasInstitutions = instCount > 0;
          const institutionsText = hasInstitutions ? `${instCount} Institution${instCount > 1 ? 's' : ''}` : 'No Institutions';

          return {
            id: c.id || 0,
            sNo: page * size + i + 1,
            name: c.name || 'N/A',
            courseType: c.courseTypeName || 'N/A',
            duration: c.duration ? `${c.duration} yrs` : 'N/A',
            students: c.studentCount || 0,
            status: isActive ? 'Active' : 'Inactive',
            institutionCount: instCount,
            institutionsText,
            hasInstitutions,
            totalApplications: c.totalApplications || 0,
            remainingApplications: c.remainingApplications || 0,
            totalAdmissions: c.totalAdmissions || 0,
            cancelledApplications: c.cancelledApplications || 0,
            cancelledAdmissions: c.cancelledAdmissions || 0,
            totalFeesCollected: c.totalFeesCollected || 0,
            formsLast7Days: c.formsLast7Days || 0,
            formsLast30Days: c.formsLast30Days || 0,
            feesLast7Days: c.feesLast7Days || 0,
            feesLast30Days: c.feesLast30Days || 0
          };
        });

        const stats: CourseStats = {
          totalCourses: pagedData.totalElements || 0,
          activeCourses: pagedData.totalElements || 0,
          offlineCourses: 0,
          totalStudents: 0
        };

        return {
          content,
          totalElements: pagedData.totalElements || 0,
          totalPages: pagedData.totalPages || 0,
          stats
        };
      })
    );
  }

  getCourseUserBreakdown(id: number, page: number = 0, size: number = 10, sortBy?: string, sortDirection?: string, session?: string): Observable<any> {
    const params: any = { page: page.toString(), size: size.toString() };
    if (sortBy) params.sortBy = sortBy;
    if (sortDirection) params.sortDirection = sortDirection;
    if (session) params.session = session;
    return this.http.get<any>(`${this.apiUrl}/${id}/user-breakdown`, { params }).pipe(
      map(res => res.data || { content: [], totalElements: 0, totalPages: 0 })
    );
  }

  downloadCourseUserBreakdownExcel(id: number, sortBy?: string, sortDirection?: string, session?: string): Observable<Blob> {
    const params: any = {};
    if (sortBy) params.sortBy = sortBy;
    if (sortDirection) params.sortDirection = sortDirection;
    if (session) params.session = session;
    return this.http.get(`${this.apiUrl}/${id}/user-breakdown/export`, { params, responseType: 'blob' });
  }

  exportCourseUserBreakdownExcel(
    courseId: number,
    userId: number,
    tab: string,
    search?: string,
    session?: string,
    fiftyPercentFeesPaid?: boolean,
    startDate?: string,
    endDate?: string,
    leadSourceId?: string,
    reportedStatus?: string,
    sourceType?: string,
    sortBy: string = 'createdAt',
    sortDirection: string = 'desc',
    appStartDate?: string,
    appEndDate?: string
  ): Observable<Blob> {
    const params: any = { tab, sortBy, sortDirection };
    if (search) params.search = search;
    if (session) params.session = session;
    if (fiftyPercentFeesPaid !== undefined && fiftyPercentFeesPaid !== null) {
      params.fiftyPercentFeesPaid = String(fiftyPercentFeesPaid);
    }
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (leadSourceId) params.leadSourceId = leadSourceId;
    if (reportedStatus && reportedStatus !== 'ALL') params.reportedStatus = reportedStatus;
    if (sourceType) params.sourceType = sourceType;
    if (appStartDate) params.appStartDate = appStartDate;
    if (appEndDate) params.appEndDate = appEndDate;

    return this.http.get(`${this.apiUrl}/${courseId}/user/${userId}/export`, {
      params,
      responseType: 'blob'
    });
  }
}
