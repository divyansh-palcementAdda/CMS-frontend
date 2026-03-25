import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardStats } from '../../../../core/models/dashboard.model';

@Component({
  selector: 'app-admission-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h3 class="section-title">Admission Management Panel</h3>
      <div class="admission-grid">
        <div class="admission-card hover-card" (click)="navigateTo('Direct')" style="cursor: pointer;">
          <div class="admission-info">
            <div class="admission-name">Direct Admission</div>
            <div class="admission-sub">Students with no consultancy mapping</div>
            <div class="admission-count">{{ displayStats.direct }}</div>
          </div>
          <div class="admission-icon-box">👥</div>
        </div>
        <div class="admission-card hover-card" (click)="navigateTo('Indirect')" style="cursor: pointer;">
          <div class="admission-info">
            <div class="admission-name">Indirect Admission</div>
            <div class="admission-sub">Students admitted through consultancy partners</div>
            <div class="admission-count">{{ displayStats.indirect }}</div>
          </div>
          <div class="admission-icon-box">👥</div>
        </div>
        <div class="admission-card hover-card" (click)="navigateTo('Scholarship')" style="cursor: pointer;">
          <div class="admission-info">
            <div class="admission-name">Scholar Admission</div>
            <div class="admission-sub">Students receiving scholarship admission</div>
            <div class="admission-count">{{ displayStats.scholar }}</div>
          </div>
          <div class="admission-icon-box">🏆</div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './admission-panel.component.scss'
})
export class AdmissionPanelComponent {
  // Store the active values to render
  displayStats = {
    direct: 0,
    indirect: 0,
    scholar: 0
  };

  constructor(private router: Router) {}

  navigateTo(type: string): void {
    this.router.navigate(['/admin/admission-management'], { queryParams: { type } });
  }

  @Input() set stats(s: DashboardStats | null) {
    const direct = (s as any)?.directStudents ?? s?.directAdmissions;
    const indirect = (s as any)?.indirectStudents ?? s?.indirectAdmissions;
    const scholar = (s as any)?.scholarStudents ?? s?.scholarAdmissions;

    if (s && (direct !== undefined || indirect !== undefined || scholar !== undefined)) {
      this.displayStats = {
        direct: direct || 0,
        indirect: indirect || 0,
        scholar: scholar || 0
      };
    } else {
      // Fallback Static Dummy Data
      this.displayStats = {
        direct: 142,
        indirect: 86,
        scholar: 24
      };
    }
  }
}
