export interface ApiResult<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface DashboardStats {
  scholarApplications: number;
  indirectApplications: number;
  directApplications: number;
  activeAssociates: number;
  inactiveAssociates: number;
  dormantAssociates: number;
  activeInstitutions: number;
  activeUsers: number;
  inactiveUsers: number;
  activeCourses: number;
  inactiveCourses: number;
  totalConsultancies: number;
  totalCourses: number;
  totalCoursesTypes: number;
  totalInstitutions: number;
  totalRoles: number;
  totalAdmissions: number;
  totalUsers: number;
  inactiveRecords: number;
  directAdmissions: number;
  indirectAdmissions: number;
  scholarAdmissions: number;
  cancelledAdmissions: number;
  cancelledEnrolments: number;
  totalEnrolments: number;

  usersWithoutConsultancy: number;
  consultanciesWithoutUsers: number;
  consultanciesWithoutCourses: number;
  coursesWithoutConsultancy: number;
  totalUnmappedRecords: number;
}

export interface ConsultancyItem {
  id?: number;
  name: string;
  email: string;
  mobile?: string;
  phone?: string;
  city: string;
  status: string;
  commissionPercentage?: number;
  commission?: number;
}

export interface RecentForm {
  id?: number;
  fullName?: string;
  name?: string;
  email: string;
  courseName?: string;
  course?: string;
  admissionDate?: string;
  discount?: number;
  discountPercentage?: number;
}

export interface ActivityItem {
  id?: number;
  icon?: string;
  title: string;
  description: string;
  performedBy?: string;
  createdAt?: string;
  timeAgo?: string;
}

export interface DashboardData {
  stats?: DashboardStats;
  consultancyData?: ConsultancyItem[];
  recentForms?: RecentForm[];
  recentActivities?: ActivityItem[];
}

export interface CommissionData {
  totalUnpaid: number;
  overdueAmount: number;
  avgDueDays: number;
  paidPercentage: number;
  pendingCount: number;
  totalCollected: number;
  totalProjected: number;
  totalPayable: number;
  totalRecords: number;
}

export interface ChartData {
  yearlyAdmissions?: YearlyPoint[];
  weeklyAdmissions?: WeeklyPoint[];
  monthlyAdmissions?: MonthlyPoint[];
  targetVsAchieved?: TargetPoint[];
  feesStatus?: NameValuePoint[];
  completionStatus?: NameValuePoint[];
  tokenAmountStats?: NameValuePoint[];
  consultancyVsCourse?: ConsultancyVsCoursePoint[];
  topConsultancies?: TopConsultancy[];
}

export interface YearlyPoint { year: string; admissions: number; }
export interface WeeklyPoint { week: string; admissions: number; }
export interface MonthlyPoint { month: string; admissions: number; }
export interface NameValuePoint { name: string; value: number; }
export interface TargetPoint { category: string; target: number; achieved: number; }
export interface ConsultancyVsCoursePoint { name: string; consultancy: number; courses: number; }
export interface TopConsultancy { admissionCount: number; consultancyName: string; }

// Legacy alias kept for backward compat
export type ChartPoint = NameValuePoint;
