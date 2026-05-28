import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-download-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="onCancel()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="download-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </div>
          <h3>{{ title }}</h3>
        </div>
        <div class="modal-body">
          <p class="modal-intro">Please confirm your download parameters:</p>
          <div class="meta-grid">
            <div class="meta-row highlight">
              <span class="label">Total Records :</span>
              <span class="value bold">{{ totalRecords }}</span>
            </div>
            
            <div class="meta-row" *ngIf="sorting && sorting.trim() !== ''">
              <span class="label">Sorting :</span>
              <span class="value text-capitalize">{{ sorting }}</span>
            </div>
            
            <div class="meta-row" *ngIf="searchQuery && searchQuery.trim() !== ''">
              <span class="label">Search Query :</span>
              <span class="value">"{{ searchQuery }}"</span>
            </div>
            
            <div class="meta-row" *ngFor="let meta of extraMeta">
              <span class="label">{{ meta.label }} :</span>
              <span class="value">{{ meta.value }}</span>
            </div>
            
            <div class="meta-row" *ngIf="appliedFilters && appliedFilters.length > 0">
              <span class="label">Applied Filters :</span>
              <span class="value">
                <span class="filter-pill" *ngFor="let filter of appliedFilters">{{ filter }}</span>
              </span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" (click)="onCancel()" [disabled]="loading">Cancel</button>
          <button class="btn-primary" (click)="onConfirm()" [disabled]="loading">
            <span *ngIf="!loading">Download Now</span>
            <span *ngIf="loading" class="spinner-inline">Downloading...</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./download-confirmation-modal.component.scss']
})
export class DownloadConfirmationModalComponent {
  @Input() title: string = 'Downloading Analytics';
  @Input() totalRecords: number = 0;
  @Input() sorting: string = '';
  @Input() searchQuery: string = '';
  @Input() appliedFilters: string[] = [];
  @Input() extraMeta: { label: string; value: string | number }[] = [];
  @Input() loading: boolean = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
