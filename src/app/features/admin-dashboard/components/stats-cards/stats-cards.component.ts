import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DashboardStats } from '../../../../core/models/dashboard.model';

interface StatCard {
  label: string;
  value: number | null;
  icon: SafeHtml;
  gradient: string;   // full CSS gradient string for the icon box
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
          <div class="stat-icon-box"
               [style.background]="c.gradient"
               [innerHTML]="c.icon">
          </div>
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

  constructor(private router: Router, private sanitizer: DomSanitizer) { }

  trackByLabel(index: number, item: StatCard): string {
    return item.label;
  }

  onCardClick(card: StatCard): void {
    if (card.route) {
      this.router.navigate([card.route], { queryParams: card.queryParams });
    }
  }

  /** Accepts either a full <svg> string or raw path data — sanitizes both safely */
  private svg(input: string): SafeHtml {
    const trimmed = input.trim();
    let html: string;
    if (trimmed.startsWith('<svg')) {
      // Full SVG passed — force width/height to 20px for uniform sizing
      html = trimmed
        .replace(/width="[^"]*"/, 'width="20"')
        .replace(/height="[^"]*"/, 'height="20"')
        .replace(/<svg /, '<svg style="display:block;flex-shrink:0;" ');
    } else {
      // Only path data passed — wrap it
      html = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           fill="white" width="20" height="20" style="display:block;flex-shrink:0;">
        ${trimmed}
      </svg>`;
    }
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private buildCards(s: DashboardStats | null): void {
    if (!s) { this.cards = []; return; }
    this.cards = [
      {
        label: 'Active Associates',
        value: s.activeAssociates,
        gradient: 'linear-gradient(135deg, #4ade80 0%, #16a34a 100%)',
        route: '/consultancy', queryParams: { status: 'ACTIVE' }, trend: '12%', trendUp: true,
        icon: this.svg(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#fff" d="M8 4a4 4 0 1 0 0 8a4 4 0 1 0 0-8m1 9H7c-2.76 0-5 2.24-5 5v1c0 .55.45 1 1 1h10c.55 0 1-.45 1-1v-1c0-2.76-2.24-5-5-5m7-.41l-2.29-2.29l-1.41 1.41l3 3c.2.2.45.29.71.29s.51-.1.71-.29l5-5l-1.41-1.41l-4.29 4.29Z"/></svg>`)
      },
      {
        label: 'Inactive Associates',
        value: s.inactiveAssociates,
        gradient: 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)',
        route: '/consultancy', queryParams: { status: 'INACTIVE' }, trend: '4%', trendUp: false,
        icon: this.svg(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640"><path fill="#fff" d="M286.1 368c98.5 0 178.3 79.8 178.3 178.3c0 16.4-13.3 29.7-29.7 29.7H78.1c-16.4 0-29.7-13.3-29.7-29.7c0-98.5 79.8-178.3 178.3-178.3zm276.2-195.9c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-33.9 33.9l33.9 33.9c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-33.9-33.9l-33.9 33.9c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l33.9-33.9l-33.9-33.9c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l33.9 33.9zM256.4 312c-66.3 0-120-53.7-120-120s53.7-120 120-120s120 53.7 120 120s-53.7 120-120 120"/></svg>`)
      },
      {
        label: 'Dormant Associates',
        value: s.dormantAssociates,
        gradient: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)',
        route: '/consultancy', queryParams: { status: 'DORMANT' }, trend: '8%', trendUp: true,
        icon: this.svg(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="512" viewBox="0 0 640 512"><path fill="#fff" d="M96 128a128 128 0 1 1 256 0a128 128 0 1 1-256 0M0 482.3C0 383.8 79.8 304 178.3 304h91.4c98.5 0 178.3 79.8 178.3 178.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3M472 200h144c13.3 0 24 10.7 24 24s-10.7 24-24 24H472c-13.3 0-24-10.7-24-24s10.7-24 24-24"/></svg>`)
      },
      {
        label: 'Active Institutes',
        value: s.activeInstitutions,
        gradient: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
        route: '/institutions', queryParams: { status: 'ACTIVE' }, trend: '10%', trendUp: true,
        icon: this.svg(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="#fff"><path d="m6 10.524l-2.27.638a1 1 0 0 0-.73.963V20a1 1 0 0 0 1 1h2zm12 0l2.27.638a1 1 0 0 1 .73.963V20a1 1 0 0 1-1 1h-2z"/><path fill-rule="evenodd" d="M12.555 3.168a1 1 0 0 0-1.11 0l-6 4a1 1 0 0 0 1.11 1.664L8 7.869V21h8V7.869l1.445.963A1 1 0 0 0 18 9a.999.999 0 0 0 .555-1.832zM10 12a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2h-2a1 1 0 0 1-1-1m1-4a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2z" clip-rule="evenodd"/></g></svg>`)
      },
      {
        label: 'Active Users',
        value: s.activeUsers,
        gradient: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
        route: '/users', queryParams: { status: 'ACTIVE' }, trend: '5%', trendUp: true,
        icon: this.svg(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="6" cy="6" r="3" fill="#fff"/><circle cx="14" cy="6" r="3" fill="#fff"/><path fill="#fff" d="M14 10c3.31 0 6 1.79 6 4v2h-6v-2c0-1.48-1.21-2.77-3-3.46c.88-.35 1.91-.54 3-.54m-8 0c3.31 0 6 1.79 6 4v2H0v-2c0-2.21 2.69-4 6-4"/></svg>`)
      },
      {
        label: 'Inactive Users',
        value: s.inactiveUsers,
        gradient: 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)',
        route: '/users', queryParams: { status: 'INACTIVE' }, trend: '2%', trendUp: false,
        icon: this.svg(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#fff" d="M19 17v2H7v-2s0-4 6-4s6 4 6 4m-3-9a3 3 0 1 0-3 3a3 3 0 0 0 3-3m3.2 5.06A5.6 5.6 0 0 1 21 17v2h3v-2s0-3.45-4.8-3.94M18 5a2.9 2.9 0 0 0-.89.14a5 5 0 0 1 0 5.72A2.9 2.9 0 0 0 18 11a3 3 0 0 0 0-6M8 10H0v2h8Z"/></svg>`)
      },
      {
        label: 'Active Courses',
        value: s.activeCourses,
        gradient: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
        route: '/courses', queryParams: { active: 'true' }, trend: '1%', trendUp: true,
        icon: this.svg(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#fff" d="M21.5 5.134a1 1 0 0 1 .493.748L22 6v13a1 1 0 0 1-1.5.866A8 8 0 0 0 13 19.6V4.426a10 10 0 0 1 8.5.708M11 4.427l.001 15.174a8 8 0 0 0-7.234.117l-.327.18l-.103.044l-.049.016l-.11.026l-.061.01L3 20h-.042l-.11-.012l-.077-.014l-.108-.032l-.126-.056l-.095-.056l-.089-.067l-.06-.056l-.073-.082l-.064-.089l-.022-.036l-.032-.06l-.044-.103l-.016-.049l-.026-.11l-.01-.061l-.004-.049L2 6a1 1 0 0 1 .5-.866a10 10 0 0 1 8.5-.707"/></svg>`)
      },
      {
        label: 'Inactive Courses',
        value: s.inactiveCourses,
        gradient: 'linear-gradient(135deg, #fdba74 0%, #f97316 100%)',
        route: '/courses', queryParams: { active: 'false' }, trend: '1%', trendUp: false,
        icon: this.svg(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="#fff" d="M4 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5.207A5.5 5.5 0 0 0 9.207 16H5a1 1 0 0 0 1 1h3.6q.276.538.657 1H6a2 2 0 0 1-2-2zm2.75 0a.75.75 0 0 0-.75.75v.5c0 .414.336.75.75.75h6.5a.75.75 0 0 0 .75-.75v-.5a.75.75 0 0 0-.75-.75zM19 14.5a4.5 4.5 0 1 1-9 0a4.5 4.5 0 0 1 9 0m-2.646-1.146a.5.5 0 0 0-.708-.708L14.5 13.793l-1.146-1.147a.5.5 0 0 0-.708.708l1.147 1.146l-1.147 1.146a.5.5 0 0 0 .708.708l1.146-1.147l1.146 1.147a.5.5 0 0 0 .708-.708L15.207 14.5z"/></svg>`)
      },
      {
        label: 'Total Admissions',
        value: s.totalAdmissions,
        gradient: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
        route: '/admin/admission-management', queryParams: { tab: 'Admission' }, trend: '1%', trendUp: true,
        icon: this.svg(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#fff" d="M15.775 18.525Q16 18.3 16 18t-.225-.525t-.525-.225t-.525.225T14.5 18t.225.525t.525.225t.525-.225m2.75 0q.225-.225.225-.525t-.225-.525T18 17.25t-.525.225t-.225.525t.225.525t.525.225t.525-.225m2.75 0Q21.5 18.3 21.5 18t-.225-.525t-.525-.225t-.525.225T20 18t.225.525t.525.225t.525-.225M18 23q-2.075 0-3.537-1.463T13 18t1.463-3.537T18 13t3.538 1.463T23 18t-1.463 3.538T18 23M7 9h10V7H7zm4.675 12H5q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v6.7q-.725-.35-1.463-.525T18 11q-.275 0-.513.012t-.487.063V11H7v2h6.125q-.45.425-.812.925T11.675 15H7v2h4.075q-.05.25-.062.488T11 18q0 .825.15 1.538T11.675 21"/></svg>`)
      },
      {
        label: 'Total Applications',
        value: s.totalEnrolments,
        gradient: 'linear-gradient(135deg, #2dd4bf 0%, #0f766e 100%)',
        route: '/admin/admission-management', queryParams: { tab: 'applications' }, trend: '1%', trendUp: false,
        icon: this.svg(`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><path fill="#fff" d="M8.5 11.5a1 1 0 1 0 0 2a1 1 0 0 0 0-2m-1 8a1 1 0 1 1 2 0a1 1 0 0 1-2 0M3 6.75A3.75 3.75 0 0 1 6.75 3h14.5A3.75 3.75 0 0 1 25 6.75v14.5A3.75 3.75 0 0 1 21.25 25H6.75A3.75 3.75 0 0 1 3 21.25zm3 5.75a2.5 2.5 0 1 0 5 0a2.5 2.5 0 0 0-5 0M8.5 17a2.5 2.5 0 1 0 0 5a2.5 2.5 0 0 0 0-5m4.5-4.75c0 .414.336.75.75.75h7.5a.75.75 0 0 0 0-1.5h-7.5a.75.75 0 0 0-.75.75m.75 6.25a.75.75 0 0 0 0 1.5h7.5a.75.75 0 0 0 0-1.5zM6 6.75c0 .414.336.75.75.75h14.5a.75.75 0 0 0 0-1.5H6.75a.75.75 0 0 0-.75.75"/></svg>`)
      },
      {
        label: 'Cancelled Admissions',
        value: s.cancelledAdmissions,
        gradient: 'linear-gradient(135deg, #fb7185 0%, #e11d48 100%)',
        route: '/admin/admission-management', queryParams: { tab: 'Admission', status: 'CANCELLED' }, trend: '1%', trendUp: false,
        icon: this.svg(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="#fff" d="M18 5.75a.75.75 0 0 0-.75-.75H2.75a.75.75 0 1 0 0 1.5h14.5a.75.75 0 0 0 .75-.75m0 3a.75.75 0 0 0-.75-.75H2.75a.75.75 0 1 0 0 1.5h9.456A5.5 5.5 0 0 1 14.5 9a5.5 5.5 0 0 1 2.294.5h.456a.75.75 0 0 0 .75-.75M9.09 15.5H2.75a.75.75 0 0 1 0-1.5h6.272a5.6 5.6 0 0 0 .069 1.5m.285-3H2.75a.75.75 0 0 1 0-1.5h7.507a5.5 5.5 0 0 0-.882 1.5m9.625 2a4.5 4.5 0 1 1-9 0a4.5 4.5 0 0 1 9 0m-4.5.707l1.146 1.147a.5.5 0 0 0 .708-.708L15.207 14.5l1.147-1.146a.5.5 0 0 0-.708-.708L14.5 13.793l-1.146-1.147a.5.5 0 0 0-.708.708l1.147 1.146l-1.147 1.146a.5.5 0 0 0 .708.708z"/></svg>`)
      },
      {
        label: 'Cancelled Applications',
        value: s.cancelledEnrolments,
        gradient: 'linear-gradient(135deg, #94a3b8 0%, #475569 100%)',
        route: '/admin/admission-management', queryParams: { tab: 'applications', status: 'CANCELLED' }, trend: '1%', trendUp: false,
        icon: this.svg(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path fill="#fff" fill-opacity="0.15" d="M13.5 3l5.5 5.5v11.5c0 .55-.45 1-1 1h-12c-.55 0-1-.45-1-1v-16c0-.55.45-1 1-1Z"/><path d="M14 3.5v4.5h4.5"/><path d="M7 13h7M7 17h5"/><circle cx="18.5" cy="18.5" r="3.5"/><path d="M16.5 16.5l4 4"/></g></svg>`)
      },
    ];
  }
}
