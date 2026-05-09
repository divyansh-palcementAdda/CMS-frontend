import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cancellation-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="onCancel()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="warning-icon">
            <span class="material-symbols-outlined">cancel</span>
          </div>
          <h3>{{ isRevoke ? 'Revoke Cancellation' : 'Cancel Admission' }}</h3>
        </div>
        <div class="modal-body">
          <p>{{ isRevoke ? 'Are you sure you want to restore this student admission? This will reactivate all calculations and tracking for this student.' : 'Are you sure you want to cancel this admission? This action will exclude the student from active analytics and commissions, but historical data will be preserved.' }}</p>
          
          <div class="reason-group" *ngIf="!isRevoke">
            <label>Cancellation Reason <span class="required">*</span></label>
            <textarea 
              [(ngModel)]="reason" 
              placeholder="Please provide a brief reason for cancellation..."
              rows="3"
              class="form-control"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" (click)="onCancel()">Back</button>
          <button 
            [class]="isRevoke ? 'btn-success' : 'btn-danger'" 
            (click)="onConfirm()"
            [disabled]="!isRevoke && !reason.trim()"
          >
            {{ isRevoke ? 'Restore Admission' : 'Confirm Cancellation' }}
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
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }

    .modal-content {
      background: white;
      padding: 24px;
      border-radius: 16px;
      width: 100%;
      max-width: 450px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .modal-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 16px;
      text-align: center;
    }

    .warning-icon {
      width: 56px;
      height: 56px;
      background: #fee2e2;
      color: #ef4444;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;

      span {
        font-size: 32px;
      }
    }

    .btn-success {
      background: #10b981;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
    }

    .btn-success:hover {
      background: #059669;
    }

    h3 {
      font-size: 20px;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .modal-body {
      margin-bottom: 24px;
      
      p {
        color: #4b5563;
        font-size: 15px;
        line-height: 1.5;
        text-align: center;
        margin-bottom: 20px;
      }
    }

    .reason-group {
      text-align: left;
      
      label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: #374151;
        margin-bottom: 8px;
      }

      .required {
        color: #ef4444;
      }

      textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 14px;
        resize: none;
        transition: border-color 0.2s;

        &:focus {
          outline: none;
          border-color: #435fff;
          box-shadow: 0 0 0 3px rgba(67, 95, 255, 0.1);
        }
      }
    }

    .modal-footer {
      display: flex;
      gap: 12px;
      justify-content: flex-end;

      button {
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      .btn-secondary {
        background: #f3f4f6;
        border: 1px solid #e5e7eb;
        color: #374151;

        &:hover {
          background: #e5e7eb;
        }
      }

      .btn-danger {
        background: #ef4444;
        border: none;
        color: white;

        &:hover {
          background: #dc2626;
        }
      }
    }
  `]
})
export class CancellationModalComponent {
  @Input() isRevoke: boolean = false;
  @Output() confirm = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  reason: string = '';

  onConfirm() {
    this.confirm.emit(this.reason);
  }

  onCancel() {
    this.cancel.emit();
  }
}
