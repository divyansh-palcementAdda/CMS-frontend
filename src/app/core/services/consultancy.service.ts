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

  constructor(private http: HttpClient) {}

  getConsultancyData(): Observable<ConsultancyPageData> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => {
        // Handle both ApiResult wrap and direct array
        const data = Array.isArray(response) ? response : (response?.data || []);
        
        let activeCount = 0;
        let totalCourseCount = 0;

        const mappedItems: ConsultancyItem[] = data.map((dto: ConsultancyDTO, index: number) => {
          if (dto.status === 'Active') activeCount++;
          totalCourseCount += (dto.courseCount || 0);

          return {
            id: dto.id || 0,
            sNo: index + 1,
            name: dto.name || 'Unknown Consultancy',
            email: dto.email || 'N/A',
            mobile: dto.mobile || 'N/A',
            city: dto.city || 'N/A',
            status: (dto.status || 'Active') as any,
            commission: dto.commissionPercentage != null ? `${dto.commissionPercentage}%` : '-'
          };
        });

        const stats: ConsultancyStats = {
          totalConsultancy: mappedItems.length,
          activeConsultancy: activeCount,
          totalProjected: '₹ 0', // To be calculated or provided by backend
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
          financials: data.financials || { totalProjected: '0', payableAmount: '0', paidAmount: '0', unpaidAmount: '0' },
          quickStats: data.quickStats || { totalCourses: 0, projectedAmount: '0', status: 'Active' },
          topCourses: data.topCourses || [],
          courses: (data.courses || []).map((c: any, index: number) => ({ ...c, sNo: index + 1 })),
          representatives: (data.representatives || []).map((r: any, index: number) => ({ ...r, sNo: index + 1 })),
          institutionsOverview: (data.institutionsOverview || []).map((i: any, index: number) => ({ ...i, sNo: index + 1 })),
          allAdmissions: (data.allAdmissions || []).map((a: any, index: number) => ({ ...a, sNo: index + 1 }))
        };
      })
    );
  }

  deleteConsultancy(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
