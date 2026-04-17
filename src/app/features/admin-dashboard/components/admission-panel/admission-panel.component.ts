import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardStats } from '../../../../core/models/dashboard.model';

interface PanelStats {
  direct: number;
  indirect: number;
  scholar: number;
  directApplications: number;
  indirectApplications: number;
  scholarApplications: number;
}

@Component({
  selector: 'app-admission-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h3 class="section-title">Admission Management Panel</h3>
      <div class="admission-grid">

        <!-- ── Admissions ─────────────────────────────────── -->
        <div class="admission-card hover-card" (click)="navigateTo('Direct')" style="cursor: pointer;">
          <div class="admission-info">
            <div class="admission-name">Direct Admission</div>
            <div class="admission-sub">Students with no consultancy mapping</div>
            <div class="admission-count">{{ displayStats.direct }}</div>
          </div>
          <div class="admission-icon-box">👤</div>
        </div>

        <div class="admission-card hover-card" (click)="navigateTo('Indirect')" style="cursor: pointer;">
          <div class="admission-info">
            <div class="admission-name">Admission via Consultancy</div>
            <div class="admission-sub">Students admitted through consultancy partners</div>
            <div class="admission-count">{{ displayStats.indirect }}</div>
          </div>
          <div class="admission-icon-box">🤝</div>
        </div>

        <div class="admission-card hover-card" (click)="navigateTo('Scholarship')" style="cursor: pointer;">
          <div class="admission-info">
            <div class="admission-name">Scholar Admission</div>
            <div class="admission-sub">Students receiving scholarship admission</div>
            <div class="admission-count">{{ displayStats.scholar }}</div>
          </div>
          <div class="admission-icon-box">🏆</div>
        </div>

        <!-- ── Applications (Enrolments) ──────────────────── -->
        <div class="admission-card hover-card" (click)="navigateTo('Direct Applications')" style="cursor: pointer;">
          <div class="admission-info">
            <div class="admission-name">Direct Applications</div>
            <div class="admission-sub">Applications with no consultancy mapping</div>
            <div class="admission-count">{{ displayStats.directApplications }}</div>
          </div>
          <div class="admission-icon-box">📋</div>
        </div>

        <div class="admission-card hover-card" (click)="navigateTo('Indirect Applications')" style="cursor: pointer;">
          <div class="admission-info">
            <div class="admission-name">Applications via Consultancy</div>
            <div class="admission-sub">Applications through consultancy partners</div>
            <div class="admission-count">{{ displayStats.indirectApplications }}</div>
          </div>
          <div class="admission-icon-box">📑</div>
        </div>

        <div class="admission-card hover-card" (click)="navigateTo('Scholarship Applications')" style="cursor: pointer;">
          <div class="admission-info">
            <div class="admission-name">Scholarship Applications</div>
            <div class="admission-sub">Applications under scholarship programmes</div>
            <div class="admission-count">{{ displayStats.scholarApplications }}</div>
          </div>
          <div class="admission-icon-box">🏅</div>
        </div>

      </div>
    </div>
  `,
  styleUrl: './admission-panel.component.scss'
})
export class AdmissionPanelComponent {

  displayStats: PanelStats = {
    direct: 0,
    indirect: 0,
    scholar: 0,
    directApplications: 0,
    indirectApplications: 0,
    scholarApplications: 0
  };

  constructor(private router: Router) { }

  navigateTo(type: string): void {
    const queryParams: Record<string, string> = {};

    switch (type) {
      // Admission tab
      case 'Direct': queryParams['source'] = 'USER'; break;
      case 'Indirect': queryParams['source'] = 'CONSULTANCY'; break;
      case 'Scholarship': queryParams['isScholar'] = 'true'; break;

      // Applications tab
      case 'Direct Applications':
        queryParams['source'] = 'USER';
        queryParams['tab'] = 'applications';
        break;
      case 'Indirect Applications':
        queryParams['source'] = 'CONSULTANCY';
        queryParams['tab'] = 'applications';
        break;
      case 'Scholarship Applications':
        queryParams['isScholar'] = 'true';
        queryParams['tab'] = 'applications';
        break;
    }

    this.router.navigate(['/admin/admission-management'], { queryParams });
  }

  @Input() set stats(s: DashboardStats | null) {
    if (!s) {
      // Fallback dummy data when no stats are loaded
      this.displayStats = {
        direct: 142,
        indirect: 86,
        scholar: 24,
        directApplications: 58,
        indirectApplications: 34,
        scholarApplications: 10
      };
      return;
    }

    this.displayStats = {
      // Admission counts from model
      direct: s.directAdmissions ?? 0,
      indirect: s.indirectAdmissions ?? 0,
      scholar: s.scholarAdmissions ?? 0,

      // Application counts — reuse the same breakdown fields
      // (backend filters by tab='applications' to return enrolment subset)
      directApplications: s.directApplications ?? 0,
      indirectApplications: s.indirectApplications ?? 0,
      scholarApplications: s.scholarApplications ?? 0
    };
  }
}
