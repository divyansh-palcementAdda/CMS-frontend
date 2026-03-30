import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConsultancyItem } from '../../../../core/models/dashboard.model';

@Component({
  selector: 'app-consultancy-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h3 class="section-title" style="font-size: 18px; font-weight: 700; margin-bottom: 16px;">Consultancy Overview</h3>
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <ng-container *ngIf="rows.length; else emptyRows">
              <tr *ngFor="let c of rows; let i = index; trackBy: trackById">
                <td class="hash-col">{{ i + 1 }}</td>
                <td>{{ c.name }}</td>
                <td>{{ c.email }}</td>
                <td>{{ c.mobile || c.phone || '—' }}</td>
                <td>{{ c.city }}</td>
                <td>
                  <span class="badge" [ngClass]="(c.status || '').toLowerCase()">
                    {{ c.status }}
                  </span>
                </td>
                <td>{{ commissionDisplay(c) }}</td>
                <td>
                  <div class="actions">
                    <button class="btn-icon" title="View" (click)="onView(c.id!)"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#292727ff"><path d="M607.5-372.5Q660-425 660-500t-52.5-127.5Q555-680 480-680t-127.5 52.5Q300-575 300-500t52.5 127.5Q405-320 480-320t127.5-52.5Zm-204-51Q372-455 372-500t31.5-76.5Q435-608 480-608t76.5 31.5Q588-545 588-500t-31.5 76.5Q525-392 480-392t-76.5-31.5ZM214-281.5Q94-363 40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200q-146 0-266-81.5ZM480-500Zm207.5 160.5Q782-399 832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280q113 0 207.5-59.5Z"/></svg></button>
                    <button class="btn-icon" title="Edit" (click)="onEdit(c.id!)"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#292727ff"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-528q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg></button>
                    <button class="btn-icon" title="Delete" (click)="onDelete(c)"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#292727ff"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg></button>
                  </div>
                </td>
              </tr>
            </ng-container>
            <ng-template #emptyRows>
              <tr>
                <td colspan="8" class="empty-row">No consultancy records found</td>
              </tr>
            </ng-template>
          </tbody>
        </table>
      </div>
      <div class="view-all-row">
        <button class="view-all-btn">View All</button>
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

  onView(id: number) { this.view.emit(id); }
  onEdit(id: number) { this.edit.emit(id); }
  onDelete(item: ConsultancyItem) { this.delete.emit(item); }

  commissionDisplay(c: ConsultancyItem): string {
    const val = c.commissionPercentage ?? c.commission;
    return val != null && val > 0 ? `${val}%` : '—';
  }

  trackById(index: number, item: ConsultancyItem): any {
    return item.id || item.email;
  }
}
