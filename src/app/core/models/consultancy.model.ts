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
  status: 'Active' | 'Inactive' | 'Dormant';
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
