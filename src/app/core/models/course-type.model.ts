export interface CourseTypeDTO {
  id?: number;
  name?: string;
  description?: string;
  active?: boolean;
  courseCount?: number;
}

export interface CreateCourseTypeDTO {
  name: string;
  description: string;
  active: boolean;
  courseId?: number;
}

export interface CourseTypeItem {
  id: number;
  sNo: number;
  name: string;
  code: string;
  description?: string;
  duration?: string;
  students: number;
  status: 'Active' | 'Inactive';
  courses: number;
}

export interface CourseTypeStats {
  totalCourseType: number;
  activeCourseType: number;
  totalCourses: number;
  totalStudents: number;
}

export interface CourseTypePageData {
  stats: CourseTypeStats;
  courseTypes: CourseTypeItem[];
  totalCount: number;
}

export interface BulkUploadResponse {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  failures: Array<{
    rowNumber: number;
    errorMessage: string;
  }>;
}
