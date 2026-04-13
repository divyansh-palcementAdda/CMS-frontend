import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdmissionService } from '../../../../core/services/admission.service';
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
  
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<boolean>(); // Emits true if 50% condition met

  paymentForm: FormGroup;
  isSubmitting = false;
  error: string | null = null;
  
  thresholdAmount = 0;
  remainingToThreshold = 0;

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
      this.paymentForm.reset({
        paymentMode: 'CASH'
      });
      this.error = null;
      this.calculateThreshold(0);
    }
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

    const request = {
      ...this.paymentForm.value,
      studentId: this.studentId
    };

    this.admissionService.addFeePayment(this.studentId, request).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.saved.emit(isMeetingThreshold); // Return whether threshold was met
        this.onClose();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = err.error?.message || 'Failed to record payment. Please try again.';
      }
    });
  }
}
