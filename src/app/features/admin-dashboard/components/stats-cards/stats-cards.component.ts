import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardStats } from '../../../../core/models/dashboard.model';

interface StatCard {
  label: string;
  value: number | null;
  icon: string;
  color: string;
  route: string;
  queryParams?: any;
  trend?: string;
  trendUp?: boolean;
}

@Component({
  selector: 'app-stats-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-grid" *ngIf="cards.length; else noStats">
      <div *ngFor="let c of cards; trackBy: trackByLabel" 
           class="stat-card clickable" 
           (click)="onCardClick(c)">
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

  constructor(private router: Router) { }

  trackByLabel(index: number, item: StatCard): string {
    return item.label;
  }

  onCardClick(card: StatCard): void {
    if (card.route) {
      this.router.navigate([card.route], { queryParams: card.queryParams });
    }
  }

  private buildCards(s: DashboardStats | null): void {
    if (!s) { this.cards = []; return; }
    this.cards = [
      { label: 'Active Associates', value: s.activeAssociates, icon: '👥', color: 'green', route: '/consultancy', queryParams: { status: 'ACTIVE' }, trend: '12%', trendUp: true },
      { label: 'Inactive Associates', value: s.inactiveAssociates, icon: '👤', color: 'red', route: '/consultancy', queryParams: { status: 'INACTIVE' }, trend: '4%', trendUp: false },
      { label: 'Dormant Associates', value: s.dormantAssociates, icon: '🏛', color: 'orange', route: '/consultancy', queryParams: { status: 'DORMANT' }, trend: '8%', trendUp: true },
      { label: 'Active Institutes', value: s.activeInstitutions, icon: '🏛', color: 'green', route: '/institutions', queryParams: { status: 'ACTIVE' }, trend: '10%', trendUp: true },
      { label: 'Active Users', value: s.activeUsers, icon: '👥', color: 'red', route: '/users', queryParams: { status: 'ACTIVE' }, trend: '5%', trendUp: true },
      { label: 'Inactive Users', value: s.inactiveUsers, icon: '👤', color: 'red', route: '/users', queryParams: { status: 'INACTIVE' }, trend: '2%', trendUp: false },
      { label: 'Active Courses', value: s.activeCourses, icon: '📚', color: 'blue', route: '/courses', queryParams: { active: 'true' }, trend: '1%', trendUp: true },
      { label: 'Inactive Courses', value: s.inactiveCourses, icon: '📕', color: 'orange', route: '/courses', queryParams: { active: 'false' }, trend: '1%', trendUp: false }
    ];
  }
}
