import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardStats } from '../../../../core/models/dashboard.model';

interface StatCard { label: string; value: number | null; icon: string; color: string; trend?: string; trendUp?: boolean; }

@Component({
  selector: 'app-stats-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-grid" *ngIf="cards.length; else noStats">
      <div *ngFor="let c of cards; trackBy: trackByLabel" class="stat-card">
        <div class="stat-top">
          <div class="stat-label">{{ c.label }}</div>
          <div class="stat-icon-box" [ngClass]="c.color">{{ c.icon }}</div>
        </div>
        <div class="stat-value-row">
          <div class="stat-value">{{ c.value ?? 0 | number }}</div>
          <div *ngIf="c.trend" class="stat-trend" [class.up]="c.trendUp" [class.down]="!c.trendUp">
            <span class="trend-icon" *ngIf="c.trendUp">↑</span>
            <span class="trend-icon" *ngIf="!c.trendUp">↓</span>
            {{ c.trend }}
          </div>
        </div>
      </div>
    </div>
    <ng-template #noStats>
      <div class="empty-state">No stats available</div>
    </ng-template>
  `,
  styleUrl: './stats-cards.component.scss'
})
export class StatsCardsComponent {
  @Input() set stats(s: DashboardStats | null) { this.buildCards(s); }
  cards: StatCard[] = [];

  trackByLabel(index: number, item: StatCard): string {
    return item.label;
  }

  private buildCards(s: DashboardStats | null): void {
    if (!s) { this.cards = []; return; }
    this.cards = [
      { label: 'Active Associates', value: s.activeAssociates, icon: '👥', color: 'green', trend: '12%', trendUp: true },
      { label: 'Inactive Associates', value: s.inactiveAssociates, icon: '👤', color: 'red', trend: '4%', trendUp: false },
      { label: 'Dormant Associates', value: s.dormantAssociates, icon: '🏛', color: 'orange', trend: '8%', trendUp: true },
      { label: 'Active Institutes', value: s.activeInstitutions, icon: '🏛', color: 'green', trend: '10%', trendUp: true },
      { label: 'Active Users', value: s.activeUsers, icon: '👥', color: 'red', trend: '5%', trendUp: true },
      { label: 'Inactive Users', value: s.inactiveUsers, icon: '👤', color: 'red', trend: '2%', trendUp: false },
      { label: 'Active Courses', value: s.activeCourses, icon: '📚', color: 'blue', trend: '1%', trendUp: true },
      { label: 'Inactive Courses', value: s.inactiveCourses, icon: '📕', color: 'orange', trend: '1%', trendUp: false },
    ];
  }
}
