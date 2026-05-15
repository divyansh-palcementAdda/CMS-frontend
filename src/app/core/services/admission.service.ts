import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AdmissionItem, AdmissionPageData } from '../models/admission.model';

@Injectable({
  providedIn: 'root'
})
export class AdmissionService {
  private apiUrl = `${environment.apiUrl}/students`;

  constructor(private http: HttpClient) { }

  /**
   * Single unified filter API — maps ALL 14 filter combinations to
   * GET /api/students with query params:
   *   tab          → 'Admission' | 'applications'
   *   source       → 'USER' | 'CONSULTANCY'
   *   isScholar    → 'true' | 'false'
   *   statusFilter → 'CANCELLED'
   *   search, statFilter, courseId, sortColumn, sortDirection, page, size
   */
  getAdmissionsData(
    page: number = 1,
    size: number = 10,
    search?: string,
    statFilter?: string,
    courseId?: number,
    sortColumn?: string,
    sortDirection?: string,
    tab?: string,
    statusFilter?: string,
    source?: string,
    isScholar?: string,
    state?: string,
    city?: string,
    session?: string,
    commissionStatus?: string,
    fiftyPercentFeesPaid?: boolean,
    startDate?: string,
    endDate?: string,
    leadSourceId?: string,
    appStartDate?: string,
    appEndDate?: string,
    admStartDate?: string,
    admEndDate?: string
  ): Observable<AdmissionPageData> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search) {
      params = params.set('search', search);
      // Also pass as enrollmentId in case the backend expects it specifically for ID search
      params = params.set('enrollmentId', search);
    }
    if (tab) params = params.set('tab', tab);
    if (statFilter) params = params.set('statFilter', statFilter);
    if (courseId) params = params.set('courseId', courseId.toString());
    if (sortColumn) params = params.set('sortColumn', sortColumn);
    if (sortDirection) params = params.set('sortDirection', sortDirection);
    if (statusFilter) params = params.set('statusFilter', statusFilter);
    if (source) params = params.set('source', source);
    if (isScholar != null && isScholar !== '') params = params.set('isScholar', isScholar);
    if (state) params = params.set('state', state);
    if (city) params = params.set('city', city);
    if (session) params = params.set('session', session);
    if (commissionStatus) params = params.set('commissionStatus', commissionStatus);
    if (fiftyPercentFeesPaid !== undefined) params = params.set('fiftyPercentFeesPaid', fiftyPercentFeesPaid.toString());
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (leadSourceId) params = params.set('leadSourceId', leadSourceId);
    if (appStartDate) params = params.set('appStartDate', appStartDate);
    if (appEndDate) params = params.set('appEndDate', appEndDate);
    if (admStartDate) params = params.set('admStartDate', admStartDate);
    if (admEndDate) params = params.set('admEndDate', admEndDate);

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(response => {
        const payload = response?.data;
        if (!payload) {
          return { stats: {} as any, admissions: [], totalCount: 0 };
        }

        const stats = payload.stats || {};
        const students = payload.admissions || [];

        const admissions = students.map((s: any, index: number) =>
          this.mapStudentToAdmissionItem(s, (page - 1) * size + index + 1)
        );

        return {
          stats,
          admissions,
          totalCount: payload.totalCount || admissions.length
        };
      })
    );
  }

  /** @deprecated Use getAdmissionsData() with source/isScholar params instead */
  getStudentsByFilter(source?: string, isScholar?: boolean, userId?: number): Observable<AdmissionPageData> {
    let params = new HttpParams();
    if (source) params = params.set('source', source);
    if (isScholar !== undefined) params = params.set('isScholar', isScholar.toString());
    if (userId) params = params.set('userId', userId.toString());

    return this.http.get<any>(`${this.apiUrl}/filter`, { params }).pipe(
      map(response => {
        const data = response?.data || [];
        const admissions = data.map((s: any, index: number) =>
          this.mapStudentToAdmissionItem(s, index + 1)
        );

        return {
          stats: {} as any,
          admissions,
          totalCount: admissions.length
        };
      })
    );
  }

  getAdmissionById(id: number | string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response?.data || response)
    );
  }

  createAdmission(admission: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, admission);
  }

  updateAdmission(id: number | string, admission: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, admission);
  }

  deleteAdmission(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  bulkUpload(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/bulk-upload`, formData);
  }

  downloadTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/template`, { responseType: 'blob' });
  }

  updateFeeStatus(id: number | undefined, isPaid: boolean): Observable<any> {
    if (!id) throw new Error('Student ID is required');
    return this.http.patch(`${this.apiUrl}/${id}/fee-status`, { fiftyPercentFeesPaid: isPaid });
  }

  addFeePayment(studentId: number, request: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${studentId}/fees`, request);
  }

  cancelAdmission(id: number, reason: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/cancel`, { reason });
  }

  revokeCancellation(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/revoke-cancellation`, {});
  }

  private mapStudentToAdmissionItem(s: any, sNo?: number): AdmissionItem {
    return {
      ...s,
      sNo: sNo,
      fullName: s.fullName || 'Unknown Student',
      courseName: s.courseName || 'N/A',
      feeStatus: s.fiftyPercentFeesPaid ? 'Paid' : 'Unpaid',
      status: s.isCancelled ? 'Cancelled' : 'Active',
      duration: s.duration || 'N/A',
      discountPercentageDisplay: s.discountType === 'PERCENTAGE' ? `${s.discountValue}%` : (s.isScholar ? 'Scholarship' : '-'),

      // Dynamic financial fields
      percentagePaid: s.finalFeesAfterDiscount > 0 ? (s.totalFeesPaid / s.finalFeesAfterDiscount) * 100 : 0,
      tokenAmount: s.totalFeesPaid || 0,
      discountPercentage: s.discountType === 'PERCENTAGE' ? s.discountValue : 0,

      // Explicit fields
      totalCourseFees: s.totalCourseFees,
      finalFeesAfterDiscount: s.finalFeesAfterDiscount,
      totalFeesPaid: s.totalFeesPaid,
      remainingFees: s.remainingFees,
      courseDurationInMonths: s.courseDurationInMonths
    };
  }

  updateCommissionStatus(id: number | undefined, status: string): Observable<any> {
    if (!id) throw new Error('Student ID is required');
    return this.http.patch(`${this.apiUrl}/${id}/commission-status`, { status });
  }

  bulkUpdateEnrollment(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/bulk-update-enrollment`, formData);
  }

  downloadEnrollmentTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/enrollment-template`, { responseType: 'blob' });
  }

  bulkUpdateAdmissionDate(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/bulk-update-admission-date`, formData);
  }

  downloadAdmissionDateTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/bulk-update-admission-date/template`, { responseType: 'blob' });
  }

  getActiveCourses(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/courses/active`);
  }

  refundAdmission(studentId: number, request: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/v1/refunds/student/${studentId}`, request);
  }

  getRefundHistory(studentId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/v1/refunds/student/${studentId}/history`);
  }
}
