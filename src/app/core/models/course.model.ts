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

export interface CreateCourseDTO {
  name: string;
  isOnline: boolean;
  active: boolean;
  duration: number;
  fees: number;
  courseTypeId: number;
  institutionIds?: number[];
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

export interface CourseDetail {
  basicInfo: {
    id: number;
    name: string;
    courseType: string;
    mode: string;
    fees: string;
    duration: string;
    status: string;
  };
  enrollmentStats: {
    currentEnrollment: number;
    description: string;
  };
  quickStats: {
    courseMode: string;
    courseFees: string;
  };
  consultancies: Array<{
    id: number;
    name: string;
    courseType: string;
    studentsEnrolled: number;
    revenueGenerated: string;
    commissionPaid: string;
  }>;
  admissions: Array<{
    id: number;
    studentName: string;
    course: string;
    duration: string;
    discount: string;
    feeStatus: string;
    status: string;
    admissionDate: string;
  }>;
  institutions: Array<{
    id: number;
    name: string;
    code: string;
    students: number;
    status: string;
    courseCount: number;
  }>;
  topConsultancies: Array<{
    label: string;
    value: number;
  }>;
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
