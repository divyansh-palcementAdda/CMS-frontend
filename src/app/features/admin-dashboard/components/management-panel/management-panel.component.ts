import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardStats } from '../../../../core/models/dashboard.model';

interface MgmtCard {
  name: string;
  sub: string;
  value: number;
  icon: string;
  path?: string;
  queryParams?: any;
}

@Component({
  selector: 'app-management-panel',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div>
      <h3 class="section-title">Admin Management Panel</h3>
      <div class="mgmt-grid" *ngIf="cards.length; else noData">
        <div *ngFor="let c of cards; trackBy: trackByName" class="mgmt-card" 
             [routerLink]="c.path" 
             [queryParams]="c.queryParams"
             [style.cursor]="c.path ? 'pointer' : 'default'"
             [class.clickable]="!!c.path">
          <div class="mgmt-info">
            <div class="mgmt-name">{{ c.name }}</div>
            <div class="mgmt-sub">{{ c.sub }}</div>
            <div class="mgmt-total">Total : {{ c.value }}</div>
          </div>
          <div class="mgmt-icon-box">{{ c.icon }}</div>
        </div>
      </div>
      <ng-template #noData>
        <div class="empty-state">No management data available</div>
      </ng-template>
    </div>
  `,
  styleUrl: './management-panel.component.scss'
})
export class ManagementPanelComponent {
  @Input() set stats(s: DashboardStats | null) { this.buildCards(s); }
  cards: MgmtCard[] = [];

  trackByName(index: number, item: MgmtCard): string {
    return item.name;
  }

  private buildCards(s: DashboardStats | null): void {
    console.log(s);
    if (!s) { this.cards = []; return; }
    console.log(s.totalUnmappedRecords);
    this.cards = [
      { name: 'Consultancy', sub: 'Manages all consultancy services', value: s.totalConsultancies, icon: '📋', path: '/consultancy' },
      { name: 'Courses', sub: 'Manages course catalog', value: s.totalCourses, icon: '📚', path: '/courses' },
      { name: 'Course Type', sub: 'Manages course categories', value: s.totalCoursesTypes, icon: '📄', path: '/course-types' },
      { name: 'Institution', sub: 'Manages partner institutions', value: s.totalInstitutions, icon: '🏛', path: '/institutions' },
      { name: 'Roles', sub: 'Manages user roles and permissions', value: s.totalRoles, icon: '🛡', path: '/roles' },
      { name: 'Admissions', sub: 'Manages admission processes', value: s.totalAdmissions, icon: '🎓', path: '/admin/admission-management', queryParams: { tab: 'Admission' } },
      { name: 'Users', sub: 'Manages all system users', value: s.totalUsers, icon: '👥', path: '/users' },
      { name: 'Inactive Records', sub: 'Manages soft deleted records', value: s.inactiveRecords, icon: '📦', path: '/consultancy', queryParams: { status: 'DELETED' } },
      { name: 'UnMapped Records', sub: 'Records without consultancy mapping', value: s.totalUnmappedRecords, icon: '🔗', path: '/unmapped' },
    ];
  }
}
