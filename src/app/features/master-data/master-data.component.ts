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
    .dashboard-body { flex: 1; display: flex; flex-direction: column; }
    .main-content { padding: 32px; flex: 1; }
    .content-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; gap: 16px; }
    .page-title { font-size: 24px; font-weight: 700; color: #1e293b; }
    
    .master-data-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
    .master-card {
      background: white;
      padding: 24px;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      cursor: pointer;
      transition: all 0.2s;
      border: 1.5px solid transparent;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .master-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
      border-color: #6366f1;
    }
    .card-icon {
      width: 56px;
      height: 56px;
      background: #f1f5f9;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6366f1;
    }
    .card-info h3 { font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 4px; }
    .card-info p { font-size: 14px; color: #64748b; line-height: 1.5; }
    .card-action { margin-top: auto; padding-top: 16px; border-top: 1px solid #f1f5f9; }
    .btn-text { color: #6366f1; font-weight: 600; font-size: 14px; }
    
    .btn-primary {
      background: #6366f1;
      color: white;
      padding: 10px 20px;
      border-radius: 10px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .btn-primary:hover { background: #4f46e5; }
    
    /* Tablet and below */
    @media (max-width: 768px) {
      .main-content { padding: 20px; }
      .content-header { 
        flex-direction: column; 
        align-items: flex-start; 
        margin-bottom: 24px;
        gap: 12px;
      }
      .page-title { font-size: 20px; }
      .btn-primary { 
        width: 100%; 
        justify-content: center;
        padding: 12px 16px;
        font-size: 14px;
      }
      .btn-primary svg { 
        width: 18px; 
        height: 18px; 
      }
      .master-data-grid { 
        grid-template-columns: 1fr; 
        gap: 16px;
      }
    }
    
    /* Mobile */
    @media (max-width: 480px) {
      .main-content { padding: 16px; }
      .content-header { margin-bottom: 20px; }
      .page-title { font-size: 18px; }
      .btn-primary { 
        padding: 10px 14px;
        font-size: 13px;
        gap: 6px;
      }
      .btn-primary svg { 
        width: 16px; 
        height: 16px; 
      }
      .master-card { padding: 20px; }
      .card-icon { 
        width: 48px; 
        height: 48px; 
      }
      .card-icon svg { 
        width: 24px; 
        height: 24px; 
      }
      .card-info h3 { font-size: 16px; }
      .card-info p { font-size: 13px; }
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
