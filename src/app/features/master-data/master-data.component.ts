import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { LocationService } from '../../core/services/location.service';
import { BulkUploadModalComponent } from '../../shared/components/bulk-upload-modal/bulk-upload-modal.component';

@Component({
  selector: 'app-master-data',
  standalone: true,
  imports: [CommonModule, SidebarComponent, TopbarComponent, BulkUploadModalComponent],
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
    .dashboard-layout { display: flex; min-height: 100vh; background: #f8fafc; }
    .dashboard-body { flex: 1; display: flex; flex-direction: column; }
    .main-content { padding: 32px; flex: 1; }
    .content-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
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
  `]
})
export class MasterDataComponent {
  locationService = inject(LocationService);
  showBulkUpload = false;

  onUploaded(result: any) {
    // Optionally handle result
  }
}
