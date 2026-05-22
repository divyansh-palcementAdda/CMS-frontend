import { Pipe, PipeTransform } from '@angular/core';
import { computeFeeStatus, feeStatusClass, FeeStatusLabel } from '../../core/utils/fee-status.util';

@Pipe({
  name: 'feeStatus',
  standalone: true
})
export class FeeStatusPipe implements PipeTransform {
  transform(totalFeesPaid: number | null | undefined, finalFeesAfterDiscount: number | null | undefined): FeeStatusLabel {
    return computeFeeStatus(totalFeesPaid, finalFeesAfterDiscount);
  }
}

@Pipe({
  name: 'feeStatusClass',
  standalone: true
})
export class FeeStatusClassPipe implements PipeTransform {
  transform(status: string | null | undefined): string {
    return feeStatusClass(status as FeeStatusLabel);
  }
}
