import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AdmissionPageData } from '../models/admission.model';

@Injectable({
  providedIn: 'root'
})
export class AdmissionService {
  private apiUrl = `${environment.apiUrl}/students`;

  constructor(private http: HttpClient) { }

  getAdmissionsData(): Observable<AdmissionPageData> {
    return this.http.get<any>(`${this.apiUrl}`).pipe(
      map(response => {
        const students = response?.data || [];
        
        const stats = {
          directAdmission: students.filter((s: any) => s.admissionSource !== 'CONSULTANCY').length,
          indirectAdmission: students.filter((s: any) => s.admissionSource === 'CONSULTANCY').length,
          scholarAdmission: students.filter((s: any) => s.isScholar).length,
          totalApplication: students.length,
          approvedAdmissions: students.length,
          pendingAdmissions: 0,
          rejectedAdmissions: 0
        };

        const admissions = students.map((s: any, index: number) => ({
          ...s,
          sNo: index + 1,
          fullName: s.fullName || '',
          courseName: s.courseName || '',
          duration: s.duration || 'N/A', // fallback if missing in DTOf
          discountPercentageDisplay: s.discountType === 'PERCENTAGE' ? `${s.discountValue}%` : (s.isScholar ? 'Scholarship' : '-'),
          feeStatus: s.fiftyPercentFeesPaid ? 'Paid' : 'Unpaid',
          status: 'Active'
        }));

        return {
          stats,
          admissions,
          totalCount: students.length
        };
      }),
      catchError(err => {
        console.warn('Failed to load admission data, using mock fallback', err);
        return of(this.getMockData());
      })
    );
  }

  updateFeeStatus(id: number | undefined, isPaid: boolean): Observable<any> {
    if (!id) return of(null);
    
    // We send a PATCH request to update the fiftyPercentFeesPaid field.
    return this.http.patch(`${this.apiUrl}/${id}/fee-status`, { fiftyPercentFeesPaid: isPaid }).pipe(
      catchError(err => {
        console.error('Error updating fee status on backend', err);
        return of(null);
      })
    );
  }

  private getMockData(): AdmissionPageData {
    return {
      stats: {
        directAdmission: 4,
        indirectAdmission: 5,
        scholarAdmission: 4,
        totalApplication: 9,
        approvedAdmissions: 3,
        pendingAdmissions: 5,
        rejectedAdmissions: 2
      },
      totalCount: 1200,
      admissions: [
        { id: 1, sNo: 1, fullName: 'John Doe', courseName: 'Computer Science', duration: '4 yrs', discountType: 'Scholarship', discountPercentageDisplay: 'Scholarship', feeStatus: 'Paid', status: 'Active', session: '2023-27', admissionDate: '12/02/26' },
        { id: 2, sNo: 2, fullName: 'Darrell Steward', courseName: 'Data Science', duration: '4 yrs', discountType: 'Percentage', discountPercentageDisplay: '12%', feeStatus: 'Unpaid', status: 'Inactive', session: '2023-27', admissionDate: '12/02/26' },
        { id: 3, sNo: 3, fullName: 'Jane Smith', courseName: 'Finance', duration: '4 yrs', discountType: 'Percentage', discountPercentageDisplay: '15%', feeStatus: 'Paid', status: 'Active', session: '2023-27', admissionDate: '12/02/26' },
        { id: 4, sNo: 4, fullName: 'Mike Johnson', courseName: 'Law', duration: '4 yrs', discountType: 'Scholarship', discountPercentageDisplay: 'Scholarship', feeStatus: 'Paid', status: 'Active', session: '2023-27', admissionDate: '12/02/26' },
        { id: 5, sNo: 5, fullName: 'Sarah Williams', courseName: 'Medicine', duration: '2 yrs', discountType: 'Percentage', discountPercentageDisplay: '15%', feeStatus: 'Paid', status: 'Active', session: '2023-27', admissionDate: '12/02/26' },
        { id: 6, sNo: 6, fullName: 'Tom Brown', courseName: 'Psychology', duration: '3 yrs', discountType: 'Percentage', discountPercentageDisplay: '15%', feeStatus: 'Paid', status: 'Active', session: '2023-27', admissionDate: '12/02/26' },
        { id: 7, sNo: 7, fullName: 'Lisa Davis', courseName: 'Physics', duration: '3 yrs', discountType: 'Percentage', discountPercentageDisplay: '15%', feeStatus: 'Paid', status: 'Active', session: '2023-27', admissionDate: '12/02/26' },
        { id: 8, sNo: 8, fullName: 'Chris Wilson', courseName: 'Arts & Design', duration: '2 yrs', discountType: 'Scholarship', discountPercentageDisplay: 'Scholarship', feeStatus: 'Paid', status: 'Active', session: '2023-27', admissionDate: '12/02/26' },
        { id: 9, sNo: 9, fullName: 'Emma Thompson', courseName: 'AI & Machine Learning', duration: '2 yrs', discountType: 'Percentage', discountPercentageDisplay: '15%', feeStatus: 'Paid', status: 'Active', session: '2023-27', admissionDate: '12/02/26' },
        { id: 10, sNo: 10, fullName: 'David Lee', courseName: 'Agriculture', duration: '4 yrs', discountType: 'Percentage', discountPercentageDisplay: '15%', feeStatus: 'Paid', status: 'Active', session: '2023-27', admissionDate: '12/02/26' }
      ]
    };
  }
}
