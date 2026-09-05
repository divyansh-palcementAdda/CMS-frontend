import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdmissionService } from '../../../../core/services/admission.service';
import { FeeService } from '../../../../core/services/fee.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-fee-payment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './fee-payment-modal.component.html',
  styleUrl: './fee-payment-modal.component.scss'
})
export class FeePaymentModalComponent implements OnInit {
  @Input() isVisible = false;
  @Input() studentId?: number;
  @Input() studentName = '';

  // New logical inputs for 50% threshold validation
  @Input() totalCourseFees = 0;
  @Input() discountAmount = 0;
  @Input() alreadyPaidAmount = 0;
  @Input() triggeredBySync = false;
  @Input() feeId?: number; // Added for Edit Mode
  
  @Input() focType = 'NONE';
  @Input() focRemarksInput = '';

  @Input() isLateralEntry: boolean | null | undefined = false;
  @Input() lateralEntryRemarkInput: string | null | undefined = '';

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<boolean>(); // Emits true if 50% condition met

  paymentForm: FormGroup;
  isSubmitting = false;
  error: string | null = null;

  thresholdAmount = 0;
  remainingToThreshold = 0;

  selectedFocType = 'NONE';
  focRemarks = '';

  isLateralEntryChecked = false;
  lateralEntryRemark = '';
  lateralEntryError: string | null = null;

  paymentModes = [
    { value: 'CASH', label: 'Cash' },
    { value: 'UPI', label: 'UPI / QR Code' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CARD', label: 'Credit / Debit Card' },
    { value: 'CHEQUE', label: 'Cheque' }
  ];

  constructor(
    private fb: FormBuilder,
    private admissionService: AdmissionService,
    private feeService: FeeService,
    private notificationService: NotificationService
  ) {
    this.paymentForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(1)]],
      paymentMode: ['CASH', Validators.required],
      referenceNo: [''],
      remarks: ['']
    });

    // Real-time remaining amount calculation
    this.paymentForm.get('amount')?.valueChanges.subscribe(val => {
      this.calculateThreshold(val || 0);
    });
  }

  ngOnInit(): void {
    if (this.isVisible) {
      this.error = null;
      this.selectedFocType = this.focType || 'NONE';
      this.focRemarks = this.focRemarksInput || '';
      
      this.isLateralEntryChecked = Boolean(this.isLateralEntry);
      this.lateralEntryRemark = this.lateralEntryRemarkInput || '';
      this.lateralEntryError = null;

      if (this.feeId) {
        this.loadFeeDetails();
      } else {
        this.paymentForm.reset({
          paymentMode: 'CASH'
        });
        this.calculateThreshold(0);
      }
      this.onFocTypeChange(this.selectedFocType);
    }
  }

  onLateralEntryToggle(checked: boolean): void {
    this.isLateralEntryChecked = checked;
    this.lateralEntryError = null;
    if (!checked) {
      this.lateralEntryRemark = '';
    }
  }

  onFocTypeChange(newVal: string) {
    this.selectedFocType = newVal;
    if (newVal === 'FOC' || newVal === 'SBS') {
      this.paymentForm.get('amount')?.disable();
      this.paymentForm.get('paymentMode')?.disable();
      this.paymentForm.get('referenceNo')?.disable();
      this.paymentForm.get('remarks')?.disable();
      this.paymentForm.get('amount')?.clearValidators();
      this.paymentForm.get('amount')?.updateValueAndValidity();
    } else {
      this.paymentForm.get('amount')?.enable();
      this.paymentForm.get('paymentMode')?.enable();
      this.paymentForm.get('referenceNo')?.enable();
      this.paymentForm.get('remarks')?.enable();
      this.paymentForm.get('amount')?.setValidators([Validators.required, Validators.min(1)]);
      this.paymentForm.get('amount')?.updateValueAndValidity();
    }
  }

  loadFeeDetails(): void {
    if (!this.feeId) return;
    this.isSubmitting = true;
    this.feeService.getFeeById(this.feeId).subscribe({
      next: (res: any) => {
        const fee = res.data || res;
        this.paymentForm.patchValue({
          amount: fee.amountPaid,
          paymentMode: fee.paymentMode,
          referenceNo: fee.referenceNo,
          remarks: fee.remarks
        });
        if (fee.isLateralEntry !== undefined) {
          this.isLateralEntryChecked = Boolean(fee.isLateralEntry);
          this.lateralEntryRemark = fee.lateralEntryRemark || '';
        }
        this.calculateThreshold(fee.amountPaid);
        this.isSubmitting = false;
      },
      error: () => {
        this.error = 'Failed to load fee details';
        this.isSubmitting = false;
      }
    });
  }

  calculateThreshold(currentInput: number): void {
    const totalAfterDiscount = this.totalCourseFees - this.discountAmount;
    this.thresholdAmount = totalAfterDiscount * 0.5;
    const currentTotal = this.alreadyPaidAmount + currentInput;
    this.remainingToThreshold = Math.max(0, this.thresholdAmount - currentTotal);
  }

  onClose(): void {
    this.close.emit();
  }

  async onSubmit() {
    // Validate lateral entry if enabled
    if (this.isLateralEntryChecked) {
      if (!this.lateralEntryRemark || !this.lateralEntryRemark.trim()) {
        this.lateralEntryError = 'Lateral Entry Remarks are required when Lateral Entry is enabled.';
        return;
      }
      if (this.lateralEntryRemark.trim().length > 500) {
        this.lateralEntryError = 'Lateral Entry Remarks cannot exceed 500 characters.';
        return;
      }
    }

    if (this.selectedFocType !== 'NONE') {
      this.isSubmitting = true;
      this.error = null;
      await this.syncLateralEntryIfChanged();
      this.admissionService.updateFocStatus(this.studentId!, this.selectedFocType, this.focRemarks).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.saved.emit(true);
          this.onClose();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.error = err.error?.message || 'Failed to update FOC status.';
        }
      });
      return;
    }

    if (this.focType !== 'NONE' && this.selectedFocType === 'NONE') {
      this.isSubmitting = true;
      this.error = null;
      await this.syncLateralEntryIfChanged();
      this.admissionService.updateFocStatus(this.studentId!, 'NONE', '').subscribe({
        next: () => {
          this.focType = 'NONE';
          this.isSubmitting = false;
          if (this.paymentForm.valid && this.paymentForm.get('amount')?.value) {
            this.recordPayment();
          } else {
            this.saved.emit(true);
            this.onClose();
          }
        },
        error: (err) => {
          this.isSubmitting = false;
          this.error = err.error?.message || 'Failed to clear FOC status.';
        }
      });
      return;
    }

    this.recordPayment();
  }

  private async syncLateralEntryIfChanged(): Promise<boolean> {
    const isChanged = (this.isLateralEntryChecked !== Boolean(this.isLateralEntry)) ||
      (this.isLateralEntryChecked && (this.lateralEntryRemark || '').trim() !== (this.lateralEntryRemarkInput || '').trim());

    if (isChanged && this.studentId) {
      try {
        await this.admissionService.updateLateralEntry(this.studentId, {
          enabled: this.isLateralEntryChecked,
          remark: this.isLateralEntryChecked ? this.lateralEntryRemark.trim() : undefined
        }).toPromise();
        this.isLateralEntry = this.isLateralEntryChecked;
        this.lateralEntryRemarkInput = this.lateralEntryRemark;
        return true;
      } catch (err: any) {
        this.error = err.error?.message || 'Failed to update Lateral Entry status.';
        return false;
      }
    }
    return true;
  }

  async recordPayment() {
    if (this.paymentForm.invalid || !this.studentId) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    const currentAmount = this.paymentForm.get('amount')?.value || 0;
    const isMeetingThreshold = (this.alreadyPaidAmount + currentAmount) >= this.thresholdAmount;

    // Validation logic for Toggle triggered payments
    if (this.triggeredBySync && !isMeetingThreshold) {
      const confirmed = await this.notificationService.confirm(
        'Threshold Not Reached',
        `The total paid amount (₹${this.alreadyPaidAmount + currentAmount}) is less than the 50% threshold (₹${this.thresholdAmount}). You still need ₹${this.remainingToThreshold} more to mark as Paid. Would you like to save this fee entry anyway? (Status will remain Unpaid).`,
        'Save Anyway',
        'Cancel'
      );

      if (!confirmed) return;
    }

    this.isSubmitting = true;
    this.error = null;

    const lateralSuccess = await this.syncLateralEntryIfChanged();
    if (!lateralSuccess && this.error) {
      this.isSubmitting = false;
      return;
    }

    const request = {
      ...this.paymentForm.value,
      studentId: this.studentId
    };

    if (this.feeId) {
      this.feeService.updateFee(this.feeId, request).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.saved.emit(isMeetingThreshold);
          this.onClose();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.error = err.error?.message || 'Failed to update fee entry.';
        }
      });
    } else {
      this.admissionService.addFeePayment(this.studentId, request).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.saved.emit(isMeetingThreshold);
          this.onClose();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.error = err.error?.message || 'Failed to record payment. Please try again.';
        }
      });
    }
  }
}
