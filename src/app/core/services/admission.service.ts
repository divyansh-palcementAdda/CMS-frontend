import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  getAdmissionsData(): Observable<AdmissionPageData> {
    return this.http.get<any>(this.apiUrl).pipe(
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

        const admissions = students.map((s: any, index: number) => this.mapStudentToAdmissionItem(s, index + 1));

        return {
          stats,
          admissions,
          totalCount: students.length
        };
      })
    );
  }

  getAdmissionById(id: number): Observable<AdmissionItem> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        const s = response?.data || response;
        if (!s) throw new Error('Student not found');
        return this.mapStudentToAdmissionItem(s);
      })
    );
  }

  updateFeeStatus(id: number | undefined, isPaid: boolean): Observable<any> {
    if (!id) throw new Error('Student ID is required');
    return this.http.patch(`${this.apiUrl}/${id}/fee-status`, { fiftyPercentFeesPaid: isPaid });
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
      percentagePaid: s.fiftyPercentFeesPaid ? 50 : 0,
      tokenAmount: s.tokenAmountPaid ? 5000 : 0, // Fallback if literal amount is missing
      discountPercentage: s.discountType === 'PERCENTAGE' ? s.discountValue : 0
    };
  }
}
