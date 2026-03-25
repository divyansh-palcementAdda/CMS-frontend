export interface AdmissionStats {
  directAdmission: number;
  indirectAdmission: number;
  scholarAdmission: number;
  totalApplication: number;
  approvedAdmissions: number;
  pendingAdmissions: number;
  rejectedAdmissions: number;
}

export interface AdmissionItem {
  id?: number;
  sNo?: number;

  fullName: string;
  fatherName?: string;
  motherName?: string;
  dateOfBirth?: string;
  email?: string;
  phoneNumber?: string;
  alternatePhone?: string;
  whatsappPhoneNo?: string;
  gender?: string;
  
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  
  enrollmentId?: string;
  admissionDate?: string;
  admissionSource?: string;
  
  consultancyId?: number;
  consultancyName?: string;
  
  admittedByUserId?: number;
  admittedByUserName?: string;
  
  counselorName?: string;
  
  courseId?: number;
  courseName: string;
  
  institutionId?: number;
  institutionName?: string;
  session?: string;
  
  discountType?: string;
  discountValue?: number;
  isScholar?: boolean;
  scholarshipDetails?: string;
  
  commissionStatus?: string;
  commissionAmount?: number;
  commissionPaidDate?: string;
  commissionPaymentReference?: string;
  
  fiftyPercentFeesPaid?: boolean;
  tokenAmountPaid?: boolean;
  
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  age?: number;

  // UI Calculated Fields
  feeStatus?: string; // 'Paid' | 'Unpaid'
  status?: string; // 'Active' | 'Inactive'
  duration?: string;
  discountPercentageDisplay?: string;
}

export interface AdmissionPageData {
  stats: AdmissionStats;
  admissions: AdmissionItem[];
  totalCount: number;
}
