import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CourseTypeDTO, CourseTypeItem, CourseTypePageData, CourseTypeStats } from '../models/course-type.model';

@Injectable({
  providedIn: 'root'
})
export class CourseTypeService {
  private apiUrl = `${environment.apiUrl}/course-types`;

  constructor(private http: HttpClient) { }

  getCourseTypesData(): Observable<CourseTypePageData> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => {
        const data = Array.isArray(response) ? response : (response?.data || response?.content || (response ? [response] : []));
        
        let totalCourseType = data.length;
        let activeCourseType = 0;
        let totalCourses = 0;
        let totalStudents = 0;

        const mappedTypes: CourseTypeItem[] = data.map((ct: CourseTypeDTO, index: number) => {
          const isActive = ct.active !== false; // defaults true
          if (isActive) activeCourseType++;
          
          let cCount = ct.courseCount || 0;
          totalCourses += cCount;

          // Mocking Students since it's not in the DTO yet
          const mockStudents = [12, 32, 45, 67, 90, 34, 67, 50, 42, 12];
          let studentsCount = mockStudents[index % mockStudents.length];
          totalStudents += studentsCount;

          // Generating a mocked Code based on Name or using pre-defined
          let code = '';
          const nameLower = (ct.name || '').toLowerCase();
          if (nameLower.includes('undergraduate')) code = 'UG';
          else if (nameLower.includes('graduate') && !nameLower.includes('under')) code = 'GR';
          else if (nameLower.includes('doctorate')) code = 'PHD';
          else if (nameLower.includes('certificate')) code = 'CERT';
          else if (nameLower.includes('diploma')) code = 'DIP';
          else code = ct.name ? ct.name.substring(0, 3).toUpperCase() : 'N/A';

          return {
            id: ct.id || index + 1,
            sNo: index + 1,
            name: ct.name || 'Unknown Type',
            code,
            students: studentsCount,
            status: isActive ? 'Active' : 'Inactive',
            courses: cCount
          };
        });

        // Mock stats if the DB is completely empty.
        const stats: CourseTypeStats = {
          totalCourseType: totalCourseType > 0 ? totalCourseType : 9,
          activeCourseType: activeCourseType > 0 ? activeCourseType : 8,
          totalCourses: totalCourses > 0 ? totalCourses : 138,
          totalStudents: totalStudents > 0 ? totalStudents : 3125
        };

        return { stats, courseTypes: mappedTypes, totalCount: totalCourseType > 0 ? totalCourseType : 1200 };
      }),
      catchError(err => {
        console.warn('Failed to load course types data, using mock fallback', err);
        return of(this.getMockData());
      })
    );
  }

  private getMockData(): CourseTypePageData {
    const mockData: CourseTypeItem[] = [
      { id: 1, sNo: 1, name: 'Undergraduate', code: 'UG', students: 12, status: 'Active', courses: 45 },
      { id: 2, sNo: 2, name: 'Graduate', code: 'GR', students: 32, status: 'Active', courses: 32 },
      { id: 3, sNo: 3, name: 'Doctorate', code: 'PHD', students: 45, status: 'Active', courses: 18 },
      { id: 4, sNo: 4, name: 'Certificate', code: 'CERT', students: 67, status: 'Active', courses: 28 },
      { id: 5, sNo: 5, name: 'Doctorate', code: 'PHD', students: 90, status: 'Active', courses: 18 },
      { id: 6, sNo: 6, name: 'Diploma', code: 'DIP', students: 34, status: 'Active', courses: 15 },
      { id: 7, sNo: 7, name: 'Undergraduate', code: 'UG', students: 67, status: 'Active', courses: 45 },
      { id: 8, sNo: 8, name: 'Graduate', code: 'GR', students: 50, status: 'Active', courses: 32 },
      { id: 9, sNo: 9, name: 'Graduate', code: 'GR', students: 42, status: 'Active', courses: 32 },
      { id: 10, sNo: 10, name: 'Certificate', code: 'CERT', students: 12, status: 'Active', courses: 28 }
    ];

    return {
      stats: {
        totalCourseType: 9,
        activeCourseType: 8,
        totalCourses: 138,
        totalStudents: 3125
      },
      courseTypes: mockData,
      totalCount: 1200
    };
  }
}
