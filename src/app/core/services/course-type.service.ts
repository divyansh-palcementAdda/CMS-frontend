import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CourseTypeDTO, CourseTypeItem, CourseTypePageData, CourseTypeStats, CreateCourseTypeDTO, BulkUploadResponse } from '../models/course-type.model';

@Injectable({
  providedIn: 'root'
})
export class CourseTypeService {
  private apiUrl = `${environment.apiUrl}/course-types`;

  constructor(private http: HttpClient) { }

  getCourseTypesData(): Observable<CourseTypePageData> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => {
        const data = Array.isArray(response) ? response : (response?.data || []);
        
        let activeCount = 0;
        let totalCourses = 0;
        let totalStudents = 0;

        const mappedTypes: CourseTypeItem[] = data.map((ct: CourseTypeDTO, index: number) => {
          const isActive = ct.active !== false;
          if (isActive) activeCount++;
          
          let cCount = ct.courseCount || 0;
          totalCourses += cCount;
          
          // Note: Backend doesn't provide student count yet, using 0 or placeholder
          let studentsCount = 0; 
          totalStudents += studentsCount;

          let code = this.getCourseCode(ct.name || '');

          return {
            id: ct.id || 0,
            sNo: index + 1,
            name: ct.name || 'Unknown Type',
            code,
            students: studentsCount,
            status: isActive ? 'Active' : 'Inactive',
            courses: cCount
          };
        });

        const stats: CourseTypeStats = {
          totalCourseType: mappedTypes.length,
          activeCourseType: activeCount,
          totalCourses: totalCourses,
          totalStudents: totalStudents
        };

        return { 
          stats, 
          courseTypes: mappedTypes, 
          totalCount: mappedTypes.length 
        };
      })
    );
  }

  getCourseTypeById(id: number): Observable<CourseTypeItem> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        const ct: CourseTypeDTO = response?.data || response;
        if (!ct) throw new Error('Course Type not found');

        const isActive = ct.active !== false;
        let code = this.getCourseCode(ct.name || '');

        return {
          id: ct.id || id,
          sNo: 1,
          name: ct.name || 'Unknown Type',
          code,
          description: ct.description || "No description available.",
          duration: "N/A", // Not in DTO
          students: 0,
          status: isActive ? 'Active' : 'Inactive',
          courses: ct.courseCount || 0
        };
      })
    );
  }

  deleteCourseType(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  createCourseType(data: CreateCourseTypeDTO): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  private getCourseCode(name: string): string {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('undergraduate')) return 'UG';
    if (nameLower.includes('graduate') && !nameLower.includes('under')) return 'GR';
    if (nameLower.includes('doctorate')) return 'PHD';
    if (nameLower.includes('certificate')) return 'CERT';
    if (nameLower.includes('diploma')) return 'DIP';
    return name ? name.substring(0, 3).toUpperCase() : 'N/A';
  }

  bulkUpload(file: File): Observable<BulkUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<BulkUploadResponse>(`${this.apiUrl}/bulk-upload`, formData);
  }

  downloadTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/bulk-upload/template`, {
      responseType: 'blob'
    });
  }
}
