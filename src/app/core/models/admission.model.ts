export interface AdmissionStats {
  directAdmission: number;
  indirectAdmission: number;
  scholarAdmission: number;
  todayApplications: number;
  todayConfirmedAdmissions: number;
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

  // Application Management Stats
  appDirect: number;
  appConsultancy: number;
  appScholar: number;
  appUnmapped: number;
  
  appConfirmed: number;
  appCancelled: number;
  appCancelledAdmissions: number;
  appRemaining: number;
  
  // Admission Management Stats
  admTotal: number;
  admDirect: number;
  admConsultancy: number;
  admScholar: number;
  admUnmapped: number;
  
  admConfirmed: number;
  admConfirmedExcludingSbsFoc?: number;
  confirmedAdmissionsExcludingSbsFoc?: number;
  admCancelled: number;
  admRemainingActive: number;

  // FOC & SBS counters
  appFoc: number;
  appSbs: number;
  admFoc: number;
  admSbs: number;
  duplicateForms: number;
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
  discountedAmount?: string;
  isScholar?: boolean;
  scholarshipDetails?: string;
  reportStatus?: string;

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
  
  // Cancellation fields
  isCancelled?: boolean;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;

  // Refund fields
  isRefunded?: boolean;
  totalRefundedAmount?: number;

  // UI Calculated Fields
  feeStatus?: string; // 'Paid' | 'Unpaid'
  status?: string; // 'Active' | 'Inactive'
  duration?: string;
  discountPercentageDisplay?: string;

  // Financial details used in templates
  percentagePaid?: number;
  tokenAmount?: number;
  discountPercentage?: number;

  leadSource?: {
    id: number;
    name: string;
  };

  feeHistory?: StudentFee[];

  // FOC / SBS fields
  focType?: string; // 'FOC' | 'SBS' | 'NONE'
  focRemarks?: string;

  recentEducation?: string;
  eduStatus?: string;
  board?: string;
  schoolOrCollegeName?: string;
  casteCategory?: string;

  isDuplicateForm?: boolean;
  duplicateRemarks?: string;
}

export interface StudentFee {
  id?: number;
  amountPaid: number;
  paymentDate: string;
  paymentMode: string;
  referenceNo?: string;
  remarks?: string;
}

export interface LeadSourceStat {
  id: string | null;
  name: string;
  count: number;
  color?: string;
}

export interface AdmissionPageData {
  stats: AdmissionStats;
  admissions: AdmissionItem[];
  leadSourceStats?: LeadSourceStat[];
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
