export interface LocationAnalyticsDTO {
  cityId?: number;
  city?: string;
  state: string;
  totalApplications: number;
  totalAdmissions: number;
  remainingApplications: number;
  cancelledApplications: number;
  cancelledAdmissions?: number;
  duplicateApplications?: number;
  duplicateAdmissions?: number;
  scholarApplications?: number;
  scholarAdmissions?: number;
  focAdmissions?: number;
  sbsAdmissions?: number;
  directApplications?: number;
  directAdmissions?: number;
  consultancyApplications?: number;
  consultancyAdmissions?: number;
  gender?: string;
  casteCategory?: string;
}

// ===== DETAIL DTOs =====

export interface GenderDetailBasicInfo {
  name: string;
  totalStudents: number;
  createdDate?: string;
  updatedDate?: string;
  status?: string;
}

export interface GenderDetailDTO {
  basicInfo: GenderDetailBasicInfo;
  kpiStats: LocationKPIStats;
}

export interface CasteDetailBasicInfo {
  name: string;
  totalStudents: number;
  createdDate?: string;
  updatedDate?: string;
  status?: string;
}

export interface CasteDetailDTO {
  basicInfo: CasteDetailBasicInfo;
  kpiStats: LocationKPIStats;
}

export interface CityDetailBasicInfo {
  id: number;
  name: string;
  state: string;
  totalStudents: number;
  createdDate?: string;
  updatedDate?: string;
  status?: string;
}

export interface LocationKPIStats {
  totalApplications: number;
  totalAdmissions: number;
  remainingApplications: number;
  cancelledApplications: number;
  cancelledAdmissions: number;
  scholarApplications: number;
  scholarAdmissions: number;
  focAdmissions: number;
  sbsAdmissions: number;
  directApplications: number;
  directAdmissions: number;
  consultancyApplications: number;
  consultancyAdmissions: number;
  duplicateApplications: number;
  duplicateAdmissions: number;
}

export interface CityDetailDTO {
  basicInfo: CityDetailBasicInfo;
  kpiStats: LocationKPIStats;
}

export interface StateDetailBasicInfo {
  name: string;
  totalCities: number;
  totalStudents: number;
  createdDate?: string;
  updatedDate?: string;
  status?: string;
  code?: string;
}

export interface StateDetailDTO {
  basicInfo: StateDetailBasicInfo;
  kpiStats: LocationKPIStats;
}

// ===== BREAKDOWN PROJECTIONS =====

export interface UserBreakdown {
  userId: number;
  userName: string;
  totalApplications: number;
  totalAdmissions: number;
  remainingApplications: number;
  cancelledApplications: number;
  cancelledAdmissions: number;
  scholarAdmissions: number;
  focStudents: number;
  sbsStudents: number;
  duplicateApplications: number;
}

export interface ConsultancyBreakdown {
  consultancyId: number;
  consultancyName: string;
  totalApplications: number;
  totalAdmissions: number;
  remainingApplications: number;
  cancelledApplications: number;
  cancelledAdmissions: number;
  focStudents: number;
  sbsStudents: number;
  duplicateApplications: number;
  projectedCommission: number;
}

export interface InstitutionBreakdown {
  institutionId: number;
  institutionName: string;
  institutionCode: string;
  totalApplications: number;
  totalAdmissions: number;
  remainingApplications: number;
  cancelledApplications: number;
  cancelledAdmissions: number;
  duplicateApplications: number;
}

export interface CourseBreakdown {
  courseId: number;
  courseName: string;
  totalApplications: number;
  totalAdmissions: number;
  remainingApplications: number;
  cancelledApplications: number;
  cancelledAdmissions: number;
  scholarAdmissions: number;
  focStudents: number;
  sbsStudents: number;
  duplicateApplications: number;
}

export interface CourseTypeBreakdown {
  courseType: string;
  totalApplications: number;
  totalAdmissions: number;
  remainingApplications: number;
  cancelledApplications: number;
  cancelledAdmissions: number;
  scholarAdmissions: number;
  focStudents: number;
  sbsStudents: number;
  duplicateApplications: number;
}

export interface LeadSourceBreakdown {
  leadSourceId: string;
  leadSourceName: string;
  totalApplications: number;
  totalAdmissions: number;
  remainingApplications: number;
  cancelledApplications: number;
  cancelledAdmissions: number;
  focAdmissions: number;
  sbsAdmissions: number;
  duplicateApplications: number;
}

export interface CityBreakdown {
  cityId: number;
  cityName: string;
  totalApplications: number;
  totalAdmissions: number;
  remainingApplications: number;
  cancelledApplications: number;
  cancelledAdmissions: number;
  duplicateApplications: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
