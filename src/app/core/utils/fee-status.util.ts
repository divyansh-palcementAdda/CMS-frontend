/**
 * Centralized Fees Status utility — single source of truth for the frontend.
 *
 * Logic:
 *   CASE 1 – UNPAID           : totalFeesPaid <= 0
 *   CASE 2 – PROVISIONAL PAID : totalFeesPaid > 0  AND  totalFeesPaid < (finalFeesAfterDiscount / 2)
 *   CASE 3 – 50% FEES PAID    : totalFeesPaid >= (finalFeesAfterDiscount / 2)
 *
 * The 50% threshold is ALWAYS based on finalFeesAfterDiscount, never on
 * original course fees, provisional amounts, or any other value.
 */

export type FeeStatusLabel = 'UNPAID' | 'PROVISIONAL PAID' | '50% FEES PAID';

export function computeFeeStatus(
  totalFeesPaid: number | null | undefined,
  finalFeesAfterDiscount: number | null | undefined
): FeeStatusLabel {
  const paid  = totalFeesPaid          ?? 0;
  const final_ = finalFeesAfterDiscount ?? 0;

  // CASE 1 – UNPAID
  if (paid <= 0) {
    return 'UNPAID';
  }

  const halfFee = final_ / 2;

  // CASE 3 – 50% FEES PAID
  if (paid >= halfFee) {
    return '50% FEES PAID';
  }

  // CASE 2 – PROVISIONAL PAID
  return 'PROVISIONAL PAID';
}

/** CSS class helper — maps status label to a badge class name */
export function feeStatusClass(status: FeeStatusLabel): string {
  switch (status) {
    case 'UNPAID':           return 'fee-status-unpaid';
    case 'PROVISIONAL PAID': return 'fee-status-provisional';
    case '50% FEES PAID':    return 'fee-status-fifty';
    default:                 return 'fee-status-unpaid';
  }
}
