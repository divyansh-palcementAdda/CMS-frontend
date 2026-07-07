export interface CourseTargetConfigurationDTO {
  id?: number;
  configurationId?: number;
  courseId?: number;
  courseName?: string;
  courses?: { id: number; name: string }[];
  courseIds?: number[];
  formTargetCount?: number;
  formTargetInterval?: string; // 'DAY' | 'WEEK' | 'MONTH'
  formTargetIntervalValue?: number;
  feeTargetCount?: number;
  feeTargetInterval?: string; // 'DAY' | 'WEEK' | 'MONTH'
  feeTargetIntervalValue?: number;
  active?: boolean;
  remarks?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  currentForms?: number;
  currentFirstFees?: number;
}

export interface CourseTargetConfigurationRequest {
  courseId?: number | null;
  courseIds: number[];
  formTargetCount: number;
  formTargetInterval: string;
  formTargetIntervalValue: number;
  feeTargetCount: number;
  feeTargetInterval: string;
  feeTargetIntervalValue: number;
  active: boolean;
  remarks?: string;
}

export interface CourseTargetConfigurationItem {
  id: number;
  sNo: number;
  courseId: number;
  courseName: string;
  courses: { id: number; name: string }[];
  courseIds: number[];
  formTargetCount: number;
  formTargetInterval: string;
  formTargetIntervalValue: number;
  feeTargetCount: number;
  feeTargetInterval: string;
  feeTargetIntervalValue: number;
  status: 'Active' | 'Inactive';
  remarks?: string;
  coursesCount: number;
  currentForms: number;
  currentFirstFees: number;
  formAchievementPct: number;
  feeAchievementPct: number;
  achievementStatus: string;
  statusColor: string;
  overAchievedForms: number;
  missedTargetForms: number;
  overAchievedFees: number;
  missedTargetFees: number;
}

export interface CourseTargetConfigurationStats {
  totalConfigurations: number;
  activeConfigurations: number;
}

export interface CourseTargetConfigurationPageData {
  stats: CourseTargetConfigurationStats;
  configurations: CourseTargetConfigurationItem[];
  totalCount: number;
}
