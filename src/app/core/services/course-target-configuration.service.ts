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

          const courses = item.courses || [];
          const courseIds = item.courseIds || [];
          const coursesCount = courses.length;

          const currentForms = item.currentForms || 0;
          const currentFirstFees = item.currentFirstFees || 0;

          const formTarget = item.formTargetCount || 0;
          const feeTarget = item.feeTargetCount || 0;

          const formAchievementPct = formTarget > 0 ? (currentForms / formTarget) * 100 : 0;
          const feeAchievementPct = feeTarget > 0 ? (currentFirstFees / feeTarget) * 100 : 0;

          const overAchievedForms = currentForms > formTarget ? (currentForms - formTarget) : 0;
          const missedTargetForms = currentForms < formTarget ? (formTarget - currentForms) : 0;

          const overAchievedFees = currentFirstFees > feeTarget ? (currentFirstFees - feeTarget) : 0;
          const missedTargetFees = currentFirstFees < feeTarget ? (feeTarget - currentFirstFees) : 0;

          let achievementStatus = 'Target Achieved';
          let statusColor = 'green';

          if (currentForms < formTarget || currentFirstFees < feeTarget) {
            achievementStatus = 'Behind Target';
            statusColor = 'red';
          } else if (currentForms > formTarget || currentFirstFees > feeTarget) {
            achievementStatus = 'Exceeded Target';
            statusColor = 'blue';
          } else {
            achievementStatus = 'Target Achieved';
            statusColor = 'green';
          }

          let courseName = item.courseName || '';
          if (courses.length > 0) {
            courseName = courses.map(c => c.name).join(', ');
          }

          return {
            id: item.id || 0,
            sNo: index + 1,
            courseId: item.courseId || 0,
            courseName: courseName || 'Unknown Course',
            courses,
            courseIds,
            formTargetCount: formTarget,
            formTargetInterval: item.formTargetInterval || 'MONTH',
            formTargetIntervalValue: item.formTargetIntervalValue || 1,
            feeTargetCount: feeTarget,
            feeTargetInterval: item.feeTargetInterval || 'MONTH',
            feeTargetIntervalValue: item.feeTargetIntervalValue || 1,
            status: isActive ? 'Active' : 'Inactive',
            remarks: item.remarks,
            coursesCount,
            currentForms,
            currentFirstFees,
            formAchievementPct,
            feeAchievementPct,
            achievementStatus,
            statusColor,
            overAchievedForms,
            missedTargetForms,
            overAchievedFees,
            missedTargetFees
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
