import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConsultancyItem } from '../../../../core/models/dashboard.model';

@Component({
  selector: 'app-consultancy-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="consultancy-container">
      <h3 class="section-title">Consultancy Overview</h3>
      
      <div class="table-card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th class="hash-col">S.No</th>
                <th>Name</th>
                <th>Email Id</th>
                <th>Mobile Number</th>
                <th>City</th>
                <th>Status</th>
                <th>Commission %</th>
                <th class="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              <ng-container *ngIf="rows.length; else emptyRows">
                <tr *ngFor="let c of rows.slice(0,5); let i = index; trackBy: trackById">
                  <td class="hash-col">{{ i + 1 }}</td>
                  <td class="name-cell">
                    <span class="user-name">{{ c.name }}</span>
                  </td>
                  <td>{{ c.email }}</td>
                  <td>{{ c.mobile || c.phone || '—' }}</td>
                  <td>{{ c.city }}</td>
                  <td>
                    <span class="badge" [ngClass]="(c.status || '').toLowerCase()">
                      {{ c.status }}
                    </span>
                  </td>
                  <td>
                    <span class="commission-label" [class.has-commission]="(c.commissionPercentage ?? c.commission ?? 0) > 0">
                      {{ commissionDisplay(c) }}
                    </span>
                  </td>
                  <td>
                    <div class="actions">
                      <button class="btn-icon view" title="View" (click)="onView(c.id!)">
                        <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280q113 0 207.5-59.5Z"/></svg>
                      </button>
                      <button class="btn-icon edit" title="Edit" (click)="onEdit(c.id!)">
                        <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-528q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>
                      </button>
                      <button class="btn-icon delete" title="Delete" (click)="onDelete(c)">
                        <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </ng-container>
              <ng-template #emptyRows>
                <tr>
                  <td colspan="8" class="empty-row">
                    <div class="empty-content">
                      <svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48" fill="#e5e7eb"><path d="M240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T740-80H240Zm280-520v-200H240v640h500v-440H520Z"/></svg>
                      <p>No consultancy records found</p>
                    </div>
                  </td>
                </tr>
              </ng-template>
            </tbody>
          </table>
        </div>
        <div class="table-footer">
          <button class="view-all-btn" (click)="onViewAll()">
            View All Consultancies
            <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18" fill="currentColor"><path d="m560-240-56-58 142-142H160v-80h486L504-662l56-58 240 240-240 240Z"/></svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './consultancy-table.component.scss'
})
export class ConsultancyTableComponent {
  @Input() set consultancies(v: ConsultancyItem[] | null | undefined) {
    this.rows = v ?? [];
  }
  rows: ConsultancyItem[] = [];

  @Output() view = new EventEmitter<number>();
  @Output() edit = new EventEmitter<number>();
  @Output() delete = new EventEmitter<ConsultancyItem>();
  @Output() viewAll = new EventEmitter<void>();

  onView(id: number) { this.view.emit(id); }
  onEdit(id: number) { this.edit.emit(id); }
  onDelete(item: ConsultancyItem) { this.delete.emit(item); }
  onViewAll() { this.viewAll.emit(); }

  commissionDisplay(c: ConsultancyItem): string {
    const val = c.commissionPercentage ?? c.commission;
    return val != null && val > 0 ? `${val}%` : '—';
  }

  trackById(index: number, item: ConsultancyItem): any {
    return item.id || item.email;
  }
}
