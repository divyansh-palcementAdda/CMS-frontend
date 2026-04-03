import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdmissionService } from '../../../../core/services/admission.service';

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
  
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  paymentForm: FormGroup;
  isSubmitting = false;
  error: string | null = null;

  paymentModes = [
    { value: 'CASH', label: 'Cash' },
    { value: 'UPI', label: 'UPI / QR Code' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CARD', label: 'Credit / Debit Card' },
    { value: 'CHEQUE', label: 'Cheque' }
  ];

  constructor(
    private fb: FormBuilder,
    private admissionService: AdmissionService
  ) {
    this.paymentForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(1)]],
      paymentMode: ['CASH', Validators.required],
      referenceNo: [''],
      remarks: ['']
    });
  }

  ngOnInit(): void {
    if (this.isVisible) {
      this.paymentForm.reset({
        paymentMode: 'CASH'
      });
      this.error = null;
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onSubmit(): void {
    if (this.paymentForm.invalid || !this.studentId) {
      this.paymentForm.markAllAsTouched();
      return;
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
        this.saved.emit();
        this.onClose();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = err.error?.message || 'Failed to record payment. Please try again.';
      }
    });
  }
}
