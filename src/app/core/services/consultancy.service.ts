import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ConsultancyDTO, ConsultancyItem, ConsultancyPageData, ConsultancyStats, ConsultancyDetail } from '../models/consultancy.model';

@Injectable({
  providedIn: 'root'
})
export class ConsultancyService {
  private apiUrl = `${environment.apiUrl}/consultancies`;

  constructor(private http: HttpClient) { }

  getConsultancyData(): Observable<ConsultancyPageData> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => {
        // Handle both ApiResult wrap and direct array
        const data = Array.isArray(response) ? response : (response?.data || []);

        let activeCount = 0;
        let inactiveCount = 0;
        let dormantCount = 0;
        let totalCourseCount = 0;
        let totalAdmissions = 0;
        let totalApplications = 0;
        let totalCancelledAdmissions = 0;
        let totalCancelledApplications = 0;

        const mappedItems: ConsultancyItem[] = data.map((dto: ConsultancyDTO, index: number) => {
          const status = (dto.status || 'ACTIVE').toUpperCase();
          if (status === 'ACTIVE') activeCount++;
          else if (status === 'INACTIVE') inactiveCount++;
          else if (status === 'DORMANT') dormantCount++;

          totalCourseCount += (dto.courseCount || 0);
          totalAdmissions += (dto.totalAdmissions || 0);
          totalApplications += (dto.totalApplications || 0);
          totalCancelledAdmissions += (dto.totalCancelledAdmissions || 0);
          totalCancelledApplications += (dto.totalCancelledApplications || 0);

          return {
            id: dto.id || 0,
            sNo: index + 1,
            name: dto.name || 'Unknown Consultancy',
            email: dto.email || 'N/A',
            mobile: dto.mobile || 'N/A',
            city: dto.city || 'N/A',
            status: status as any,
            commission: dto.commissionPercentage != null ? `${dto.commissionPercentage}%` : '-',
            totalAdmissions: Number(dto.totalAdmissions) || 0,
            totalApplications: Number(dto.totalApplications) || 0,
            totalCancelledAdmissions: Number(dto.totalCancelledAdmissions) || 0,
            totalCancelledApplications: Number(dto.totalCancelledApplications) || 0
          };
        });

        const stats: ConsultancyStats = {
          totalConsultancy: mappedItems.length,
          activeConsultancy: activeCount,
          inactiveConsultancy: inactiveCount,
          dormantConsultancy: dormantCount,
          totalAdmissions,
          totalApplications,
          totalCancelledAdmissions,
          totalCancelledApplications,
          totalProjected: '₹ 0',
          totalCourses: totalCourseCount
        };

        return {
          stats,
          consultancies: mappedItems,
          totalCount: mappedItems.length
        };
      })
    );
  }

  getConsultanciesByStatus(status: string): Observable<ConsultancyPageData> {
    return this.http.get<any>(`${this.apiUrl}/status/${status.toUpperCase()}`).pipe(
      map(response => {
        const data = Array.isArray(response) ? response : (response?.data || []);

        let activeCount = 0;
        let inactiveCount = 0;
        let dormantCount = 0;
        let totalCourseCount = 0;
        let totalAdmissions = 0;
        let totalApplications = 0;
        let totalCancelledAdmissions = 0;
        let totalCancelledApplications = 0;

        const mappedItems: ConsultancyItem[] = data.map((dto: ConsultancyDTO, index: number) => {
          const statusVal = (dto.status || 'ACTIVE').toUpperCase();
          if (statusVal === 'ACTIVE') activeCount++;
          else if (statusVal === 'INACTIVE') inactiveCount++;
          else if (statusVal === 'DORMANT') dormantCount++;

          totalCourseCount += (dto.courseCount || 0);
          totalAdmissions += (dto.totalAdmissions || 0);
          totalApplications += (dto.totalApplications || 0);
          totalCancelledAdmissions += (dto.totalCancelledAdmissions || 0);
          totalCancelledApplications += (dto.totalCancelledApplications || 0);

          return {
            id: dto.id || 0,
            sNo: index + 1,
            name: dto.name || 'Unknown Consultancy',
            email: dto.email || 'N/A',
            mobile: dto.mobile || 'N/A',
            city: dto.city || 'N/A',
            status: statusVal as any,
            commission: dto.commissionPercentage != null ? `${dto.commissionPercentage}%` : '-',
            totalAdmissions: Number(dto.totalAdmissions) || 0,
            totalApplications: Number(dto.totalApplications) || 0,
            totalCancelledAdmissions: Number(dto.totalCancelledAdmissions) || 0,
            totalCancelledApplications: Number(dto.totalCancelledApplications) || 0
          };
        });

        const stats: ConsultancyStats = {
          totalConsultancy: mappedItems.length,
          activeConsultancy: activeCount,
          inactiveConsultancy: inactiveCount,
          dormantConsultancy: dormantCount,
          totalAdmissions,
          totalApplications,
          totalCancelledAdmissions,
          totalCancelledApplications,
          totalProjected: '₹ 0',
          totalCourses: totalCourseCount
        };

        return {
          stats,
          consultancies: mappedItems,
          totalCount: mappedItems.length
        };
      })
    );
  }

  getConsultanciesByStatusAndDeleted(status: string, deleted: boolean): Observable<ConsultancyPageData> {
    return this.http.get<any>(`${this.apiUrl}/status/${status.toUpperCase()}/deleted/${deleted}`).pipe(
      map(response => {
        const data = Array.isArray(response) ? response : (response?.data || []);

        let activeCount = 0;
        let inactiveCount = 0;
        let dormantCount = 0;
        let totalCourseCount = 0;
        let totalAdmissions = 0;
        let totalApplications = 0;
        let totalCancelledAdmissions = 0;
        let totalCancelledApplications = 0;

        const mappedItems: ConsultancyItem[] = data.map((dto: ConsultancyDTO, index: number) => {
          const statusVal = (dto.status || 'ACTIVE').toUpperCase();
          if (statusVal === 'ACTIVE') activeCount++;
          else if (statusVal === 'INACTIVE') inactiveCount++;
          else if (statusVal === 'DORMANT') dormantCount++;

          totalCourseCount += (dto.courseCount || 0);
          totalAdmissions += (dto.totalAdmissions || 0);
          totalApplications += (dto.totalApplications || 0);
          totalCancelledAdmissions += (dto.totalCancelledAdmissions || 0);
          totalCancelledApplications += (dto.totalCancelledApplications || 0);

          return {
            id: dto.id || 0,
            sNo: index + 1,
            name: dto.name || 'Unknown Consultancy',
            email: dto.email || 'N/A',
            mobile: dto.mobile || 'N/A',
            city: dto.city || 'N/A',
            status: statusVal as any,
            commission: dto.commissionPercentage != null ? `${dto.commissionPercentage}%` : '-',
            totalAdmissions: Number(dto.totalAdmissions) || 0,
            totalApplications: Number(dto.totalApplications) || 0,
            totalCancelledAdmissions: Number(dto.totalCancelledAdmissions) || 0,
            totalCancelledApplications: Number(dto.totalCancelledApplications) || 0
          };
        });

        const stats: ConsultancyStats = {
          totalConsultancy: mappedItems.length,
          activeConsultancy: activeCount,
          inactiveConsultancy: inactiveCount,
          dormantConsultancy: dormantCount,
          totalAdmissions,
          totalApplications,
          totalCancelledAdmissions,
          totalCancelledApplications,
          totalProjected: '₹ 0',
          totalCourses: totalCourseCount
        };

        return {
          stats,
          consultancies: mappedItems,
          totalCount: mappedItems.length
        };
      })
    );
  }

  getConsultancyById(id: number): Observable<ConsultancyDetail> {
    return this.http.get<any>(`${this.apiUrl}/${id}/detail`).pipe(
      map(response => {
        const data = response.data || response;
        if (!data) throw new Error('Consultancy not found');

        return {
          ...data.basicInfo,

          financials: data.financials || {
            totalProjected: '0',
            payableAmount: '0',
            paidAmount: '0',
            unpaidAmount: '0'
          },

          quickStats: data.quickStats || {
            totalCourses: 0,
            projectedAmount: '0',
            status: 'Active'
          },

          topCourses: data.topCourses || [],

          courses: (data.courses || []).map((c: any, index: number) => ({
            ...c,
            sNo: index + 1
          })),

          representatives: (data.representatives || []).map((r: any, index: number) => ({
            ...r,
            sNo: index + 1
          })),

          institutionsOverview: (data.institutionsOverview || []).map((i: any, index: number) => ({
            ...i,
            sNo: index + 1
          })),

          institutions: data.institutions || [],

          allAdmissions: (data.allAdmissions || []).map((a: any, index: number) => ({
            ...a,
            sNo: index + 1
          })),

          totalAdmissionsList: (data.totalAdmissions || []).map((a: any, index: number) => ({
            ...a,
            sNo: index + 1
          })),

          totalApplicationsList: (data.totalApplications || []).map((a: any, index: number) => ({
            ...a,
            sNo: index + 1
          })),

          cancelledApplicationsList: (data.cancelledApplications || []).map((a: any, index: number) => ({
            ...a,
            sNo: index + 1
          })),

          cancelledAdmissionsList: (data.cancelledAdmissions || []).map((a: any, index: number) => ({
            ...a,
            sNo: index + 1
          })),

          yearlyAdmissions: data.yearlyAdmissions || []
        };
      })
    );
  }

  deleteConsultancy(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  createConsultancy(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  updateConsultancy(id: number | string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  bulkUpload(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/bulk-upload`, formData);
  }

  downloadTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/bulk-upload/template`, { responseType: 'blob' });
  }

  downloadExcel(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download-excel`, { responseType: 'blob' });
  }

  getActiveInstitutions(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/institutions/active`);
  }

  getActiveCourses(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/courses/active`);
  }

  getActiveUsers(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/user/status/ACTIVE`);
  }
}
