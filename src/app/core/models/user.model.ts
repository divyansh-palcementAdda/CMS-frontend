export interface UserRole {
  roleId: number;
  name: string;
}

export interface UserConsultancy {
  id: number;
  name: string;
  email: string;
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
  totalAdmissions?: number;

  consultancies?: UserConsultancy[];

  // Dynamic stats from backend
  admissionStats?: {
    directAdmissions: number;
    viaConsultancy: number;
    totalAdmissions: number;
  };
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
