export interface CourseTargetConfigurationDTO {
  id?: number;
  courseId?: number;
  courseName?: string;
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
}

export interface CourseTargetConfigurationRequest {
  courseId: number;
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
  formTargetCount: number;
  formTargetInterval: string;
  formTargetIntervalValue: number;
  feeTargetCount: number;
  feeTargetInterval: string;
  feeTargetIntervalValue: number;
  status: 'Active' | 'Inactive';
  remarks?: string;
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
