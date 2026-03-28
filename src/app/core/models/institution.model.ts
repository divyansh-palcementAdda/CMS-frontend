export interface InstitutionItem {
  id?: number;
  sNo?: number;
  name: string;
  code: string;
  students: number;
  status: 'Active' | 'Inactive';
  course: string;
}

export interface InstitutionStats {
  totalInstitutions: number;
  activeInstitutions: number;
  totalCourses: number;
  totalStudents: number;
}

export interface InstitutionPageData {
  stats: InstitutionStats;
  institutions: InstitutionItem[];
  totalCount: number;
}

export interface InstitutionDetail {
  basicInfo: {
    id: number;
    name: string;
    code: string;
    institutionType: string;
    description: string;
    email: string;
    phoneNumber: string;
    website: string;
    establishedYear: number;
    address: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  quickStats: {
    totalCourses: number;
    totalStudents: number;
    totalConsultancies: number;
    status: string;
  };
  enrollmentTrends: Array<{
    label: string;
    value: number;
  }>;
  courses: Array<{
    id: number;
    name: string;
    type: string;
    duration: string;
    students: number;
    status: string;
    institution: string;
  }>;
  consultancies: Array<{
    id: number;
    name: string;
    email: string;
    mobile: string;
    city: string;
    status: string;
    commission: string;
  }>;
  admissions: Array<{
    id: number;
    studentName: string;
    courseName: string;
    duration: string;
    discount: string;
    feeStatus: string;
    status: string;
    session: string;
    admissionDate: string;
  }>;
  softlyDeletedRecords: Array<{
    id: number;
    recordName: string;
    type: string;
    deletedOn: string;
    deletedBy: string;
    status: string;
    institution: string;
  }>;
  top5Consultancies: Array<{
    label: string;
    value: number;
  }>;
}
