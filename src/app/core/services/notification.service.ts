import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type NotificationType = 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO' | 'CONFIRM';

export interface NotificationData {
  title: string;
  message: string;
  type: NotificationType;
  confirmLabel?: string;
  cancelLabel?: string;
  resolve?: (value: boolean) => void;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new BehaviorSubject<NotificationData | null>(null);
  notification$: Observable<NotificationData | null> = this.notificationSubject.asObservable();

  show(data: NotificationData) {
    this.notificationSubject.next(data);
  }

  success(title: string, message: string) {
    this.show({ title, message, type: 'SUCCESS' });
  }

  error(title: string, message: string) {
    this.show({ title, message, type: 'ERROR' });
  }

  warning(title: string, message: string) {
    this.show({ title, message, type: 'WARNING' });
  }

  info(title: string, message: string) {
    this.show({ title, message, type: 'INFO' });
  }

  confirm(title: string, message: string, confirmLabel: string = 'Confirm', cancelLabel: string = 'Cancel'): Promise<boolean> {
    return new Promise((resolve) => {
      this.show({
        title,
        message,
        type: 'CONFIRM',
        confirmLabel,
        cancelLabel,
        resolve
      });
    });
  }

  clear() {
    this.notificationSubject.next(null);
  }
}
