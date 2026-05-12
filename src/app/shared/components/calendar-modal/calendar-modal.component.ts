import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-calendar-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="onCancel()">
      <div class="calendar-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="header-content">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <h3>Select Custom Date Range</h3>
          </div>
          <button class="close-btn" (click)="onCancel()">&times;</button>
        </div>

        <div class="modal-body">
          <div class="date-inputs">
            <div class="input-group">
              <label>Start Date</label>
              <input type="date" [(ngModel)]="startDate" (change)="validateDates()" class="date-field">
            </div>
            <div class="input-group">
              <label>End Date</label>
              <input type="date" [(ngModel)]="endDate" (change)="validateDates()" class="date-field">
            </div>
          </div>
          
          <div *ngIf="errorMessage" class="error-msg">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {{ errorMessage }}
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-reset" (click)="onReset()">Reset</button>
          <div class="footer-actions">
            <button class="btn-cancel" (click)="onCancel()">Cancel</button>
            <button class="btn-apply" [disabled]="!startDate || !endDate || !!errorMessage" (click)="onApply()">Apply Range</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      padding: 20px;
    }

    .calendar-modal {
      background: white;
      width: 100%;
      max-width: 440px;
      border-radius: 20px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      overflow: hidden;
      animation: modalSlideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes modalSlideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .modal-header {
      padding: 20px 24px;
      background: #F8FAFC;
      border-bottom: 1px solid #E2E8F0;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-content {
        display: flex;
        align-items: center;
        gap: 12px;
        color: #1E293B;
        
        svg { color: #435FFF; }
        h3 { margin: 0; font-size: 16px; font-weight: 700; }
      }

      .close-btn {
        background: #F1F5F9;
        border: none;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        color: #64748B;
        cursor: pointer;
        transition: all 0.2s;
        &:hover { background: #E2E8F0; color: #1E293B; }
      }
    }

    .modal-body {
      padding: 24px;

      .date-inputs {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          
          label { font-size: 13px; font-weight: 600; color: #475569; }
          .date-field {
            width: 100%;
            padding: 12px;
            border: 1.5px solid #E2E8F0;
            border-radius: 10px;
            font-size: 14px;
            color: #1E293B;
            outline: none;
            transition: all 0.2s;
            &:focus { border-color: #435FFF; box-shadow: 0 0 0 3px rgba(67, 95, 255, 0.1); }
          }
        }
      }

      .error-msg {
        margin-top: 16px;
        padding: 10px 14px;
        background: #FEF2F2;
        color: #DC2626;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }

    .modal-footer {
      padding: 20px 24px;
      background: #F8FAFC;
      border-top: 1px solid #E2E8F0;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .footer-actions {
        display: flex;
        gap: 12px;
      }

      button {
        padding: 10px 20px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-reset { background: none; border: none; color: #64748B; &:hover { color: #EF4444; } }
      .btn-cancel { background: white; border: 1.5px solid #E2E8F0; color: #475569; &:hover { background: #F1F5F9; } }
      .btn-apply { 
        background: #435FFF; 
        border: none; 
        color: white; 
        box-shadow: 0 4px 6px -1px rgba(67, 95, 255, 0.2);
        &:hover { background: #354ED1; transform: translateY(-1px); }
        &:disabled { background: #94A3B8; cursor: not-allowed; transform: none; box-shadow: none; }
      }
    }
  `]
})
export class CalendarModalComponent {
  @Input() initialStartDate?: string;
  @Input() initialEndDate?: string;
  @Output() apply = new EventEmitter<{ startDate: string; endDate: string }>();
  @Output() close = new EventEmitter<void>();

  startDate: string = '';
  endDate: string = '';
  errorMessage: string = '';

  ngOnInit() {
    if (this.initialStartDate) this.startDate = this.initialStartDate;
    if (this.initialEndDate) this.endDate = this.initialEndDate;
  }

  validateDates() {
    this.errorMessage = '';
    if (this.startDate && this.endDate) {
      if (new Date(this.endDate) < new Date(this.startDate)) {
        this.errorMessage = 'End date cannot be earlier than start date';
      }
    }
  }

  onReset() {
    this.startDate = '';
    this.endDate = '';
    this.errorMessage = '';
  }

  onCancel() {
    this.close.emit();
  }

  onApply() {
    if (this.startDate && this.endDate && !this.errorMessage) {
      this.apply.emit({ startDate: this.startDate, endDate: this.endDate });
    }
  }
}
