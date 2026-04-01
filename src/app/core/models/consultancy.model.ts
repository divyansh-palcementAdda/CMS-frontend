export interface ConsultancyDTO {
  id?: number;
  name?: string;
  email?: string;
  pan?: string;
  mobile?: string;
  alternateNo?: string;
  whatsappNo?: string;
  city?: string;
  state?: string;
  permanentAddress?: string;
  currentAddress?: string;
  institutionOrFirmName?: string;
  commissionPercentage?: number;
  status?: string;
  deleted?: boolean;
  gstin?: string;
  website?: string;
  courseCount?: number;
  representativeCount?: number;
  studentCount?: number;
  institutionCount?: number;
}

export interface ConsultancyItem {
  id: number;
  sNo: number;
  name: string;
  email: string;
  mobile: string;
  city: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DORMANT';
  commission: string;
}

export interface ConsultancyStats {
  totalConsultancy: number;
  activeConsultancy: number;
  totalProjected: string;
  totalCourses: number;
}

export interface ConsultancyPageData {
  stats: ConsultancyStats;
  consultancies: ConsultancyItem[];
  totalCount: number;
}

export interface ConsultancyFinancials {
  totalProjected: string;
  payableAmount: string;
  paidAmount: string;
  unpaidAmount: string;
}

export interface ConsultancyCourse {
  id: number;
  sNo: number;
  name: string;
  type: string;
  duration: string;
  students: number;
  status: 'Active' | 'Inactive';
  institution: string;
}

export interface ConsultancyChartData {
  label: string;
  value: number;
}

export interface ConsultancyRepresentative {
  id: number;
  sNo: number;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
}

export interface ConsultancyInstitutionOverview {
  id: number;
  sNo: number;
  institutionName: string;
  courseName: string;
  courseType: string;
  admissionCount: number;
}

export interface ConsultancyAdmission {
  id: number;
  sNo: number;
  studentName: string;
  courseName: string;
  duration: string;
  discount: string;
  feeStatus: 'Paid' | 'Unpaid' | 'Partial';
  status: 'Active' | 'Inactive';
  session: string;
  admissionDate: string;
}

export interface ConsultancyDetail extends ConsultancyDTO {
  financials: ConsultancyFinancials;
  quickStats: {
    totalCourses: number;
    projectedAmount: string;
    status: 'Active' | 'Inactive' | 'Dormant';
  };
  topCourses: ConsultancyChartData[];
  courses: ConsultancyCourse[];
  representatives: ConsultancyRepresentative[];
  institutionsOverview: ConsultancyInstitutionOverview[];
  allAdmissions: ConsultancyAdmission[];
}
