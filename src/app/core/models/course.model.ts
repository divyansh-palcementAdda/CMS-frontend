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
  totalApplications?: number;
  totalAdmissions?: number;
  cancelledApplications?: number;
  cancelledAdmissions?: number;
  institutionIds?: number[];
  totalFeesCollected?: number;
  remainingApplications?: number;
  formsLast7Days?: number;
  formsLast30Days?: number;
  feesLast7Days?: number;
  feesLast30Days?: number;
  todayForms?: number;
  todayFirstFees?: number;
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
  totalApplications: number;
  remainingApplications?: number;
  totalAdmissions: number;
  cancelledApplications: number;
  cancelledAdmissions: number;
  totalFeesCollected?: number;
  formsLast7Days?: number;
  formsLast30Days?: number;
  feesLast7Days?: number;
  feesLast30Days?: number;
  todayForms?: number;
  todayFirstFees?: number;
}

export interface CourseStats {
  totalCourses: number;
  activeCourses: number;
  offlineCourses: number;
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
    totalApplications?: number;
    totalAdmissions?: number;
  }>;
  admissionStats?: {
    activeAdmissions: number;
    activeApplications: number;
    cancelledAdmissions: number;
    cancelledApplications: number;
    activeConsultancies: number;
    inactiveConsultancies: number;
    dormantConsultancies: number;
    totalConsultancies: number;
    coursesWithoutConsultancy?: number;
    admissionInAllCourses: number;
    scholarAdmissions: number;
    directAdmissions: number;
    viaConsultancy: number;
    scholarApplications: number;
    directApplications: number;
    viaConsultancyApplications: number;
  };
  totalApplications: any[];
  totalAdmissions: any[];
  cancelledApplications: any[];
  cancelledAdmissions: any[];
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
  last10DaysForms?: number;
  last30DaysForms?: number;
  last10DaysAdmissions?: number;
  last30DaysAdmissions?: number;
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
