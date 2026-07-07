import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { LocationService } from '../../core/services/location.service';
import { BulkUploadModalComponent } from '../../shared/components/bulk-upload-modal/bulk-upload-modal.component';

@Component({
  selector: 'app-master-data',
  standalone: true,
  imports: [CommonModule, SidebarComponent, TopbarComponent, BulkUploadModalComponent, RouterLink],
  template: `
    <div class="dashboard-layout">
      <app-sidebar></app-sidebar>
      <div class="dashboard-body">
        <app-topbar></app-topbar>
        <main class="main-content">
          <div class="content-header">
            <h2 class="page-title">Master Data Management</h2>
            <div class="header-actions">
              <button class="btn-primary" (click)="showBulkUpload = true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <span>Bulk Upload Locations</span>
              </button>
            </div>
          </div>

          <div class="master-data-grid">
            <div class="master-card" routerLink="/lead-sources">
              <div class="card-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div class="card-info">
                <h3>Lead Source Master</h3>
                <p>Manage dynamic sources like Digital, Consultant, etc.</p>
              </div>
              <div class="card-action">
                <span class="btn-text">Manage Sources</span>
              </div>
            </div>

            <div class="master-card" routerLink="/historical-analytics">
              <div class="card-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <div class="card-info">
                <h3>Historical Snapshot Master</h3>
                <p>Manage daily course snapshots for session comparison reports</p>
              </div>
              <div class="card-action">
                <span class="btn-text">Manage Snapshots</span>
              </div>
            </div>

            <div class="master-card" routerLink="/course-target-configurations">
              <div class="card-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="6"></circle>
                  <circle cx="12" cy="12" r="2"></circle>
                </svg>
              </div>
              <div class="card-info">
                <h3>Course Target Master</h3>
                <p>Configure form admission and first-fee targets for each course</p>
              </div>
              <div class="card-action">
                <span class="btn-text">Manage Targets</span>
              </div>
            </div>

            <div class="master-card" (click)="showBulkUpload = true">
              <div class="card-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <div class="card-info">
                <h3>Location Master</h3>
                <p>Manage states and cities for the entire system</p>
              </div>
              <div class="card-action">
                <span class="btn-text">Upload New</span>
              </div>
            </div>
          </div>

          <!-- Bulk Upload Modal -->
          <app-bulk-upload-modal
            *ngIf="showBulkUpload"
            [title]="'Bulk Upload Locations'"
            [moduleName]="'Location'"
            [service]="locationService"
            (closed)="showBulkUpload = false"
            (uploaded)="onUploaded($event)">
          </app-bulk-upload-modal>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-layout { display: flex; min-height: 100vh; background: #ffffff; }
    .dashboard-body { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .main-content { padding: 24px; flex: 1; }

    .content-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 28px;
      gap: 16px;
      flex-wrap: wrap;
    }
    .page-title { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0; }

    .master-data-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }

    .master-card {
      background: white;
      padding: 24px;
      border-radius: 20px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
      border: 1px solid #e2e8f0;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      gap: 16px;
      text-decoration: none;
    }
    .master-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0,0,0,0.06);
      border-color: #7c3aed;
    }
    .card-icon {
      width: 52px;
      height: 52px;
      background: #f5f3ff;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #7c3aed;
      transition: all 0.25s ease;
    }
    .master-card:hover .card-icon {
      background: linear-gradient(135deg, #7c3aed, #435fff);
      color: white;
    }
    .card-info h3 { font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; }
    .card-info p { font-size: 13px; color: #64748b; line-height: 1.5; margin: 0; }
    .card-action { margin-top: auto; padding-top: 16px; border-top: 1px solid #f1f5f9; }
    .btn-text {
      color: #7c3aed;
      font-weight: 600;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .btn-primary {
      display: flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #af71ff, #435fff);
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 500;
      font-size: 14px;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(175,113,255,0.2);
    }
    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(175,113,255,0.3);
      opacity: 0.9;
    }

    /* Tablet */
    @media (max-width: 768px) {
      .main-content { padding: 16px; }
      .content-header {
        flex-direction: column;
        align-items: stretch;
        margin-bottom: 20px;
        gap: 12px;
      }
      .btn-primary { width: 100%; justify-content: center; }
      .master-data-grid { grid-template-columns: 1fr; gap: 14px; }
      .page-title { font-size: 20px; }
    }

    /* Mobile */
    @media (max-width: 480px) {
      .main-content { padding: 12px; }
      .page-title { font-size: 18px; }
      .master-card { padding: 18px; }
      .card-icon { width: 46px; height: 46px; }
      .card-info h3 { font-size: 15px; }
      .card-info p { font-size: 12px; }
    }
  `]
})
export class MasterDataComponent {
  locationService = inject(LocationService);
  showBulkUpload = false;

  onUploaded(result: any) {
    // Optionally handle result
  }
}
