import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ActivityItem } from '../../../../core/models/dashboard.model';
import { ActivityService } from '../../../../core/services/activity.service';

interface ActivityVm {
  icon: string;
  iconBg: string;
  title: string;
  desc: string;
  by: string;
  time: string;
  hasDetails: boolean;
  details: Array<{ key: string; value: string }>;
  isExpanded: boolean;
}

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="activity-card">
      <div class="activity-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h4 class="activity-title" style="margin: 0;">Recent Activity</h4>
        <div class="loader-spinner" *ngIf="loading" style="width: 20px; height: 20px; border: 2px solid #e2e8f0; border-top: 2px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      </div>
      <ng-container *ngIf="vm.length; else empty">
        <div class="activity-list">
          <div *ngFor="let a of vm; trackBy: trackByFn" class="activity-item-wrapper">
            <div class="activity-item" [class.clickable]="a.hasDetails" (click)="toggleDetails(a)">
              <div class="activity-icon" [style.background]="a.iconBg">{{ a.icon }}</div>
              <div class="activity-body">
                <div class="activity-row">
                  <span class="activity-name">{{ a.title }}</span>
                  <span class="activity-time">{{ a.time }}</span>
                </div>
                <div class="activity-desc">{{ a.desc }}</div>
                <div class="activity-footer">
                  <span class="activity-by" *ngIf="a.by">{{ a.by }}</span>
                  <span class="activity-details-toggle" *ngIf="a.hasDetails">
                    {{ a.isExpanded ? 'Hide Details ▲' : 'View Details ▼' }}
                  </span>
                </div>
              </div>
            </div>
            
            <!-- Expandable Details Section -->
            <div class="activity-details-panel" *ngIf="a.hasDetails && a.isExpanded">
              <div class="details-grid">
                <div *ngFor="let detail of a.details" class="detail-row">
                  <span class="detail-key">{{ detail.key }}</span>
                  <span class="detail-value">{{ detail.value }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
      <ng-template #empty>
        <div class="empty-activity" *ngIf="!loading">No recent activity</div>
      </ng-template>
    </div>
  `,
  styles: [`
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `],
  styleUrl: './activity-feed.component.scss'
})
export class ActivityFeedComponent implements OnInit, OnDestroy {
  vm: ActivityVm[] = [];
  loading = true;
  private sub?: Subscription;

  constructor(private activityService: ActivityService) { }

  ngOnInit(): void {
    this.fetchActivities();
  }

  fetchActivities(): void {
    this.loading = true;
    this.sub = this.activityService.getRecentActivities(16).subscribe((activities) => {

      if (activities && activities.length > 0) {
        this.mapData(activities);
      } else {
        console.warn('No activity data or empty array returned, falling back to static data.');
        this.loadStaticFallback();
      }
      this.loading = false;
    });
  }

  mapData(arr: any[]): void {
    const bgPalette = ['#f5f3ff', '#eff6ff', '#f0fdf4', '#fff7ed', '#fdf4ff'];
    this.vm = arr.map((a, i) => {
      // Use provided background or fallback to the palette
      const bgColor = a?.iconBg || bgPalette[i % bgPalette.length];

      // Determine the "by" text
      let byText = '';
      if (a?.by) {
        byText = String(a.by);
      } else if (a?.performedBy) {
        byText = `by ${String(a.performedBy)}`;
      }

      const rawDesc = String(a?.desc ?? a?.description ?? '');
      
      // Parse description and metadata
      const parts = rawDesc.split(/--- Metadata ---/i);
      const cleanDesc = parts[0].trim();
      const detailsList: Array<{ key: string; value: string }> = [];
      let hasDetailsVal = false;

      if (parts.length > 1) {
        hasDetailsVal = true;
        const lines = parts[1].split('\n');
        lines.forEach(line => {
          const colonIdx = line.indexOf(':');
          if (colonIdx !== -1) {
            const key = line.substring(0, colonIdx).trim();
            const value = line.substring(colonIdx + 1).trim();
            if (key && value) {
              detailsList.push({ key, value });
            }
          }
        });
      }

      return {
        icon: a?.icon ? String(a.icon) : '🕒',
        iconBg: bgColor,
        title: String(a?.title ?? 'Activity'),
        desc: cleanDesc,
        by: byText,
        time: String(a?.time ?? a?.timeAgo ?? ''),
        hasDetails: hasDetailsVal,
        details: detailsList,
        isExpanded: false
      };
    });
  }

  loadStaticFallback(): void {
    this.vm = [
      { icon: '📝', iconBg: '#f5f3ff', title: 'New Admission Form', desc: 'Rahul Sharma submitted application for B.Tech', by: 'by Agent Amit', time: '10 mins ago', hasDetails: false, details: [], isExpanded: false },
      { icon: '💰', iconBg: '#eff6ff', title: 'Fee Payment Received', desc: '₹50,000 processed for first semester', by: 'by System', time: '1 hour ago', hasDetails: false, details: [], isExpanded: false },
      { icon: '📄', iconBg: '#f0fdf4', title: 'Document Verified', desc: '10th & 12th marksheets verified for Priya', by: 'by Admin User', time: '3 hours ago', hasDetails: false, details: [], isExpanded: false },
      { icon: '🏛', iconBg: '#fff7ed', title: 'Institute Onboarded', desc: 'Global Tech University added to portal', by: 'by Super Admin', time: '5 hours ago', hasDetails: false, details: [], isExpanded: false },
      { icon: '🎓', iconBg: '#fdf4ff', title: 'Course Published', desc: 'New MBA Analytics specialization added', by: 'by Admin User', time: '1 day ago', hasDetails: false, details: [], isExpanded: false },
      { icon: '📞', iconBg: '#f5f3ff', title: 'Follow-up Scheduled', desc: 'Consultancy call scheduled with Abhishek', by: 'by Agent Rohan', time: '1 day ago', hasDetails: false, details: [], isExpanded: false },
      { icon: '📝', iconBg: '#f5f3ff', title: 'New Admission Form', desc: 'Rahul Sharma submitted application for B.Tech', by: 'by Agent Amit', time: '10 mins ago', hasDetails: false, details: [], isExpanded: false },
      { icon: '💰', iconBg: '#eff6ff', title: 'Fee Payment Received', desc: '₹50,000 processed for first semester', by: 'by System', time: '1 hour ago', hasDetails: false, details: [], isExpanded: false },
      { icon: '📄', iconBg: '#f0fdf4', title: 'Document Verified', desc: '10th & 12th marksheets verified for Priya', by: 'by Admin User', time: '3 hours ago', hasDetails: false, details: [], isExpanded: false },
      { icon: '🏛', iconBg: '#fff7ed', title: 'Institute Onboarded', desc: 'Global Tech University added to portal', by: 'by Super Admin', time: '5 hours ago', hasDetails: false, details: [], isExpanded: false },
      { icon: '🎓', iconBg: '#fdf4ff', title: 'Course Published', desc: 'New MBA Analytics specialization added', by: 'by Admin User', time: '1 day ago', hasDetails: false, details: [], isExpanded: false },
      { icon: '📞', iconBg: '#f5f3ff', title: 'Follow-up Scheduled', desc: 'Consultancy call scheduled with Abhishek', by: 'by Agent Rohan', time: '1 day ago', hasDetails: false, details: [], isExpanded: false },
      { icon: '📞', iconBg: '#f5f3ff', title: 'Follow-up Scheduled', desc: 'Consultancy call scheduled with Abhishek', by: 'by Agent Rohan', time: '1 day ago', hasDetails: false, details: [], isExpanded: false },
      { icon: '✅', iconBg: '#eff6ff', title: 'Admission Confirmed', desc: 'Neill admitted to Engineering Batch 2026', by: 'by Admin User', time: '2 days ago', hasDetails: false, details: [], isExpanded: false }
    ];
  }

  toggleDetails(item: ActivityVm): void {
    if (item.hasDetails) {
      item.isExpanded = !item.isExpanded;
    }
  }

  trackByFn(index: number, item: ActivityVm): any {
    return index;
  }

  // Still keeping the input fallback so it won't break parent component bindings
  @Input() set activities(value: ActivityItem[] | null | undefined) {
    if (value && value.length > 0) {
      console.log('--- Incoming Data from @Input (Dashboard Service) ---');
      console.log(value);
      this.mapData(value);
      this.loading = false;
      if (this.sub) {
        this.sub.unsubscribe();
      }
    }
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}
