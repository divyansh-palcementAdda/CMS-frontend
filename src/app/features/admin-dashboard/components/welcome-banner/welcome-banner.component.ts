import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { CommissionData } from '../../../../core/models/dashboard.model';

@Component({
  selector: 'app-welcome-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="banner-wrap">
      <div class="projected-card" *ngIf="data; else noCommission">
        <div class="projected-left">
          <div class="projected-label">
            <span class="rupee-icon">₹</span>
            Total Projected Amount
          </div>
          <div class="projected-amount">₹{{ fmt(data.totalProjected) }}</div>
          <div class="progress-row">
            <div class="progress-bar-wrap">
              <div class="progress-bar-fill" [style.width.%]="paidPct"></div>
            </div>
            <span class="progress-label">{{ paidPct }}% Paid</span>
          </div>
          <span class="pending-badge">{{ data.pendingCount }} Pending</span>
        </div>
        <div class="projected-chips">
          <div class="amount-chip">
            <div class="chip-icon">💳</div>
            <div>
              <div class="chip-label">Payable Amount</div>
              <div class="chip-value">₹{{ fmt(data.totalPayable) }}</div>
            </div>
          </div>
          <div class="amount-chip">
            <div class="chip-icon">💰</div>
            <div>
              <div class="chip-label">Paid Amount</div>
              <div class="chip-value">₹{{ fmt(data.totalCollected) }}</div>
            </div>
          </div>
          <div class="amount-chip">
            <div class="chip-icon">📋</div>
            <div>
              <div class="chip-label">UnPaid Amount</div>
              <div class="chip-value">₹{{ fmt(data.totalUnpaid) }}</div>
            </div>
          </div>
        </div>
      </div>

      <ng-template #noCommission>
        <div class="projected-card projected-empty">
          <span>Commission data unavailable</span>
        </div>
      </ng-template>
    </div>
  `,
  styleUrl: './welcome-banner.component.scss'
})
export class WelcomeBannerComponent {
  @Input() commissionData: CommissionData | null = null;

  constructor(private auth: AuthService) { }

  get data(): CommissionData | null { return this.commissionData; }

  get paidPct(): number {
    if (!this.data?.totalProjected || !this.data?.totalCollected) return 0;
    return Math.min(100, Math.round((this.data.totalCollected / this.data.totalProjected) * 100));
  }

  fmt(n: number): string {
    return (n ?? 0).toLocaleString('en-IN');
  }
}
