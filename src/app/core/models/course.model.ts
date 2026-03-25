export interface CourseDTO {
  id?: number;
  name?: string;
  isOnline?: boolean;
  active?: boolean;
  courseTypeId?: number;
  courseTypeName?: string;
  studentCount?: number;
  institutionCount?: number;
  consultancyCount?: number;
  duration?: number;
  fees?: number;
}

export interface CourseItem {
  id: number;
  sNo: number;
  name: string;
  courseType: string;
  duration: string;
  students: number;
  status: 'Active' | 'Inactive';
  institutionCount: number;
  institutionsText: string;
  hasInstitutions: boolean;
}

export interface CourseStats {
  totalCourses: number;
  activeCourses: number;
  onlineCourses: number;
  totalStudents: number;
}

export interface CoursePageData {
  stats: CourseStats;
  courses: CourseItem[];
  totalCount: number;
}
