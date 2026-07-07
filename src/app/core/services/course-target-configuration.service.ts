import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  CourseTargetConfigurationDTO,
  CourseTargetConfigurationRequest,
  CourseTargetConfigurationPageData,
  CourseTargetConfigurationItem
} from '../models/course-target-configuration.model';

@Injectable({
  providedIn: 'root'
})
export class CourseTargetConfigurationService {
  private apiUrl = `${environment.apiUrl}/course-target-configurations`;

  constructor(private http: HttpClient) { }

  getConfigurationsData(): Observable<CourseTargetConfigurationPageData> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => {
        const data = Array.isArray(response) ? response : (response?.data || []);
        let activeCount = 0;

        const mapped: CourseTargetConfigurationItem[] = data.map((item: CourseTargetConfigurationDTO, index: number) => {
          const isActive = item.active !== false;
          if (isActive) activeCount++;

          return {
            id: item.id || 0,
            sNo: index + 1,
            courseId: item.courseId || 0,
            courseName: item.courseName || 'Unknown Course',
            formTargetCount: item.formTargetCount || 0,
            formTargetInterval: item.formTargetInterval || 'MONTH',
            formTargetIntervalValue: item.formTargetIntervalValue || 1,
            feeTargetCount: item.feeTargetCount || 0,
            feeTargetInterval: item.feeTargetInterval || 'MONTH',
            feeTargetIntervalValue: item.feeTargetIntervalValue || 1,
            status: isActive ? 'Active' : 'Inactive',
            remarks: item.remarks
          };
        });

        return {
          stats: {
            totalConfigurations: mapped.length,
            activeConfigurations: activeCount
          },
          configurations: mapped,
          totalCount: mapped.length
        };
      })
    );
  }

  getConfigurationById(id: number): Observable<CourseTargetConfigurationDTO> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response?.data || response)
    );
  }

  createConfiguration(request: CourseTargetConfigurationRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, request);
  }

  updateConfiguration(id: number, request: CourseTargetConfigurationRequest): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, request);
  }

  activateConfiguration(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/activate`, {});
  }

  deactivateConfiguration(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  deleteConfiguration(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}/delete`);
  }
}
