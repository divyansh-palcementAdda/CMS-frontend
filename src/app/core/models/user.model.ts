export interface UserRole {
  roleId: number;
  name: string;
  rawName?: string; // Original backend name for forms
}

export interface UserConsultancy {
  id: number;
  name: string;
  email: string;
  mobile?: string;
  city?: string;
  commissionPercentage?: number;
  duration: string;
  students: number;
  status: 'Active' | 'Inactive';
  institutionName: string;
}

export interface UserItem {
  id: number;
  username: string;
  fullName: string;
  email: string;
  mobile?: string;
  roles: UserRole[]; // Detailed roles for summary
  role?: string;     // Joined roles for display and search
  sNo?: number;      // Serial number for display
  status: 'Active' | 'Inactive';
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;

  // Stats from Figma
  directAdmissions?: number;
  viaConsultancy?: number;
  consultancies?: UserConsultancy[];
  
  // Flattened stats for table display
  totalAdmissions?: number;
  totalApplications?: number;
  cancelledAdmissions?: number;
  cancelledApplications?: number;

  // Dynamic stats from backend
  admissionStats?: {
    directAdmissions: number;
    viaConsultancy: number;
    totalAdmissions: number;
    activeAssociates: number;
    inactiveAssociates: number;
    dormantAssociates: number;
    totalConsultancies: number;
    admissionInAllCourses: number;
    scholarAdmissions: number;
    coursesWithoutConsultancy: number;

    // Added for Application System
    activeAdmissions: number;
    activeApplications: number;
    cancelledAdmissions: number;
    cancelledApplications: number;

    // Secondary Source Breakdown
    scholarApplications: number;
    directApplications: number;
    viaConsultancyApplications: number;

    // Consultancy Status Breakdown
    activeConsultancies: number;
    inactiveConsultancies: number;
    dormantConsultancies: number;
  };
}

export interface UserAdmissionDetail {
  id: number;
  studentName: string;
  courseName: string;
  duration: string;
  discount: string;
  feeStatus: string;
  status: string;
  session: string;
  admissionDate: string;
  commissionAmount: number;
  commissionStatus: string;
  // New fields for filtering
  isScholler?: any;
  source?: any;
  totalFeesPaid?: number;
}

export interface UserDetail {
  basicInfo: UserItem;
  totalApplications: UserAdmissionDetail[];
  totalAdmissions: UserAdmissionDetail[];
  cancelledApplications: UserAdmissionDetail[];
  cancelledAdmissions: UserAdmissionDetail[];
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
}

export interface UserPageData {
  stats: UserStats;
  users: UserItem[];
  totalCount: number;
}

export interface CreateUserDTO {
  username: string;
  password?: string;
  email: string;
  fullName: string;
  mobile?: string;
  roles: string[];
  otp?: string;
}

export interface SuccessEntry {
  id: number;
  message: string;
}

export interface FailureEntry {
  rowNumber: number;
  errorMessage: string;
}

export interface BulkUserUploadResponse {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  successes: SuccessEntry[];
  failures: FailureEntry[];
}
