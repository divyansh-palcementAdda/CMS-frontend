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

  getAdmissionsData(
    page: number = 1,
    size: number = 10,
    search?: string,
    statFilter?: string,
    courseId?: number,
    sortColumn?: string,
    sortDirection?: string
  ): Observable<AdmissionPageData> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search) params = params.set('search', search);
    if (statFilter) params = params.set('statFilter', statFilter);
    if (courseId) params = params.set('courseId', courseId.toString());
    if (sortColumn) params = params.set('sortColumn', sortColumn);
    if (sortDirection) params = params.set('sortDirection', sortDirection);

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

  bulkUpload(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/bulk-upload`, formData);
  }

  downloadTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/bulk-upload/template`, { responseType: 'blob' });
  }

  updateFeeStatus(id: number | undefined, isPaid: boolean): Observable<any> {
    if (!id) throw new Error('Student ID is required');
    return this.http.patch(`${this.apiUrl}/${id}/fee-status`, { fiftyPercentFeesPaid: isPaid });
  }

  addFeePayment(studentId: number, request: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${studentId}/fees`, request);
  }

  deleteAdmission(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  private mapStudentToAdmissionItem(s: any, sNo?: number): AdmissionItem {
    return {
      ...s,
      sNo: sNo,
      fullName: s.fullName || 'Unknown Student',
      courseName: s.courseName || 'N/A',
      feeStatus: s.fiftyPercentFeesPaid ? 'Paid' : 'Unpaid',
      status: 'Active',
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
}
