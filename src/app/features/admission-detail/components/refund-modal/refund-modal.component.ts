import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-refund-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="onCancel()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="refund-icon">
            <span class="material-symbols-outlined">payments</span>
          </div>
          <h3>Process Fee Refund</h3>
          <p class="subtitle">Issue refund for {{ studentName }}</p>
        </div>
        
        <div class="modal-body">
          <div class="info-summary">
            <div class="info-item">
              <label>Total Paid</label>
              <div class="value">₹{{ totalPaid | number:'1.0-0' }}</div>
            </div>
            <div class="info-item">
              <label>Already Refunded</label>
              <div class="value red-text">₹{{ alreadyRefunded | number:'1.0-0' }}</div>
            </div>
            <div class="info-item highlight">
              <label>Max Refundable</label>
              <div class="value green-text">₹{{ (totalPaid - alreadyRefunded) | number:'1.0-0' }}</div>
            </div>
          </div>

          <div class="form-group">
            <label>Refund Amount <span class="required">*</span></label>
            <div class="input-with-icon">
              <span class="currency">₹</span>
              <input 
                type="number" 
                [(ngModel)]="refundAmount" 
                placeholder="Enter amount to refund"
                class="form-control"
                [max]="totalPaid - alreadyRefunded"
              >
            </div>
            <p class="helper-text" *ngIf="refundAmount > (totalPaid - alreadyRefunded)">
              Amount cannot exceed ₹{{ (totalPaid - alreadyRefunded) | number:'1.0-0' }}
            </p>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label>Refund Mode <span class="required">*</span></label>
              <select [(ngModel)]="refundMode" class="form-control">
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label>Reference No</label>
              <input 
                type="text" 
                [(ngModel)]="referenceNo" 
                placeholder="Txn ID / Ref No"
                class="form-control"
              >
            </div>
          </div>

          <div class="form-group">
            <label>Refund Reason <span class="required">*</span></label>
            <textarea 
              [(ngModel)]="reason" 
              placeholder="e.g., Student withdrew after cancellation..."
              rows="2"
              class="form-control"
            ></textarea>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label>Remarks</label>
            <input 
              type="text" 
              [(ngModel)]="remarks" 
              placeholder="Any internal notes"
              class="form-control"
            >
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" (click)="onCancel()">Cancel</button>
          <button 
            class="btn-primary" 
            (click)="onConfirm()"
            [disabled]="!isValid()"
          >
            Process Refund
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(15, 23, 42, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1100;
      backdrop-filter: blur(8px);
    }

    .modal-content {
      background: white;
      padding: 32px;
      border-radius: 24px;
      width: 100%;
      max-width: 500px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(226, 232, 240, 0.8);
    }

    .modal-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 24px;
      text-align: center;

      h3 {
        font-size: 22px;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
        margin-top: 16px;
      }

      .subtitle {
        font-size: 14px;
        color: #64748b;
        margin-top: 4px;
      }
    }

    .refund-icon {
      width: 64px;
      height: 64px;
      background: #fef3c7;
      color: #d97706;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;

      span {
        font-size: 36px;
      }
    }

    .info-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      background: #f8fafc;
      padding: 16px;
      border-radius: 16px;
      margin-bottom: 24px;
      border: 1px solid #f1f5f9;

      .info-item {
        text-align: center;
        
        label {
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
          margin-bottom: 4px;
          font-weight: 600;
        }

        .value {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
        }

        &.highlight {
           background: white;
           border-radius: 12px;
           padding: 8px 4px;
           box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
      }

      .red-text { color: #ef4444 !important; }
      .green-text { color: #10b981 !important; }
    }

    .form-group {
      margin-bottom: 20px;
      
      label {
        display: block;
        font-size: 14px;
        font-weight: 600;
        color: #334155;
        margin-bottom: 8px;
      }

      .required {
        color: #ef4444;
      }

      .input-with-icon {
        position: relative;
        
        .currency {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          font-weight: 600;
        }

        input {
          padding-left: 32px;
        }
      }

      .form-control {
        width: 100%;
        padding: 12px 16px;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        font-size: 15px;
        transition: all 0.2s;
        color: #1e293b;

        &:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }
      }

      textarea {
        resize: none;
      }

      .helper-text {
        font-size: 12px;
        color: #ef4444;
        margin-top: 6px;
        font-weight: 500;
      }
    }

    .modal-footer {
      display: flex;
      gap: 12px;
      margin-top: 32px;

      button {
        flex: 1;
        padding: 14px;
        border-radius: 14px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      .btn-secondary {
        background: white;
        border: 1.5px solid #e2e8f0;
        color: #475569;

        &:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
      }

      .btn-primary {
        background: #6366f1;
        border: none;
        color: white;
        box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.4);

        &:hover {
          background: #4f46e5;
          transform: translateY(-1px);
          box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.4);
        }

        &:active {
          transform: translateY(0);
        }
      }
    }
  `]
})
export class RefundModalComponent implements OnInit {
  @Input() studentName: string = '';
  @Input() totalPaid: number = 0;
  @Input() alreadyRefunded: number = 0;
  @Output() confirm = new EventEmitter<{
    amount: number, 
    reason: string, 
    refundMode: string, 
    referenceNo: string, 
    remarks: string,
    refundDate: string
  }>();
  @Output() cancel = new EventEmitter<void>();

  refundAmount: number = 0;
  reason: string = '';
  refundMode: string = 'Cash';
  referenceNo: string = '';
  remarks: string = '';
  refundDate: string = new Date().toISOString().split('T')[0];

  ngOnInit() {
    // Default to full remaining balance for convenience
    this.refundAmount = this.totalPaid - this.alreadyRefunded;
  }

  isValid(): boolean {
    const maxRefundable = this.totalPaid - this.alreadyRefunded;
    return this.refundAmount > 0 && 
           this.refundAmount <= maxRefundable && 
           !!this.reason.trim() &&
           !!this.refundMode;
  }

  onConfirm() {
    if (this.isValid()) {
      this.confirm.emit({
        amount: this.refundAmount,
        reason: this.reason,
        refundMode: this.refundMode,
        referenceNo: this.referenceNo,
        remarks: this.remarks,
        refundDate: this.refundDate
      });
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}
