import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, NotificationData } from '../../../core/services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-modal.component.html',
  styleUrls: ['./notification-modal.component.scss']
})
export class NotificationModalComponent implements OnInit, OnDestroy {
  data: NotificationData | null = null;
  private sub: Subscription | null = null;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.sub = this.notificationService.notification$.subscribe(data => {
      this.data = data;
    });
  }

  onConfirm(): void {
    const resolve = this.data?.resolve;
    this.notificationService.clear();
    if (resolve) {
      resolve(true);
    }
  }

  onCancel(): void {
    const resolve = this.data?.resolve;
    this.notificationService.clear();
    if (resolve) {
      resolve(false);
    }
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}
