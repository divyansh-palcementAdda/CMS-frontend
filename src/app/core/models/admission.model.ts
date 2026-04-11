export interface AdmissionStats {
  directAdmission: number;
  indirectAdmission: number;
  scholarAdmission: number;
  totalApplication: number;
  partialFeesPaid: number;
  tokenAmountPaid: number;
  partialfessUnpaid: number;
  tokenAmountUnpaid: number;

  // Financial Status
  totalAmountCollected: number;
  totalAmountPending: number;
  totalAmountDiscounted: number;
  totalRevenueExpected: number;
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
  country?: string;
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

  totalCourseFees?: number;
  finalFeesAfterDiscount?: number;
  totalFeesPaid?: number;
  remainingFees?: number;
  courseDurationInMonths?: number;

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

  // Financial details used in templates
  percentagePaid?: number;
  tokenAmount?: number;
  discountPercentage?: number;

  feeHistory?: StudentFee[];
}

export interface StudentFee {
  id?: number;
  amountPaid: number;
  paymentDate: string;
  paymentMode: string;
  referenceNo?: string;
  remarks?: string;
}

export interface AdmissionPageData {
  stats: AdmissionStats;
  admissions: AdmissionItem[];
  totalCount: number;
}

export interface BulkUploadResponse {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  failures: Array<{
    rowNumber: number;
    errorMessage: string;
  }>;
}
