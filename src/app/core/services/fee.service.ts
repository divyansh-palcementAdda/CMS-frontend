import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface FeeHistory {
  id: number;
  studentId: number;
  studentName: string;
  enrollmentId: string;
  courseName: string;
  amountPaid: number;
  paymentDate: string;
  paymentMode: string;
  referenceNo: string;
  remarks: string;
  isLateralEntry?: boolean;
  lateralEntryRemark?: string;
}

export interface CourseWiseCollection {
  courseName: string;
  amount: number;
}

export interface FeeStats {
  totalCollected: number;
  todayCollection: number;
  thisWeekCollection: number;
  thisMonthCollection: number;
  thisYearCollection: number;
  thisSessionCollection: number;
  totalStudentsPaid: number;
  totalStudentsWithPendingFees: number;
  averageCollection: number;
  courseWiseCollection: CourseWiseCollection[];
  recentTransactions: FeeHistory[];
}

export interface FeeFilterRequest {
  page?: number;
  size?: number;
  sortColumn?: string;
  sortDirection?: string;
  courseId?: number;
  studentId?: number;
  paymentMode?: string;
  referenceNo?: string;
  session?: string;
  startDate?: string;
  endDate?: string;
  leadSourceId?: number;
  search?: string;
  statusFilter?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FeeService {
  private apiUrl = `${environment.apiUrl}/fees`;

  constructor(private http: HttpClient) { }

  getFeeHistory(page: number, size: number, filters?: FeeFilterRequest): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filters) {
      if (filters.courseId) params = params.set('courseId', filters.courseId.toString());
      if (filters.studentId) params = params.set('studentId', filters.studentId.toString());
      if (filters.paymentMode) params = params.set('paymentMode', filters.paymentMode);
      if (filters.referenceNo) params = params.set('referenceNo', filters.referenceNo);
      if (filters.session) params = params.set('session', filters.session);
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
      if (filters.leadSourceId) params = params.set('leadSourceId', filters.leadSourceId.toString());
      if (filters.search) params = params.set('search', filters.search);
      if (filters.sortColumn) params = params.set('sortColumn', filters.sortColumn);
      if (filters.sortDirection) params = params.set('sortDirection', filters.sortDirection);
      if (filters.statusFilter) params = params.set('statusFilter', filters.statusFilter);
    }

    return this.http.get<any>(`${this.apiUrl}/history`, { params });
  }

  getFeeStats(filters?: FeeFilterRequest): Observable<FeeStats> {
    let params = new HttpParams();
    if (filters?.session) {
      params = params.set('session', filters.session);
    }
    return this.http.get<any>(`${this.apiUrl}/stats`, { params }).pipe(
      map((res: any) => res.data || res)
    );
  }

  getFeeById(id: number): Observable<FeeHistory> {
    return this.http.get<FeeHistory>(`${this.apiUrl}/${id}`);
  }

  updateFee(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  deleteFee(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
