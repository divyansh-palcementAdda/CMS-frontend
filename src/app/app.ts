import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationModalComponent } from './shared/components/notification-modal/notification-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NotificationModalComponent],
  template: `
    <router-outlet></router-outlet>
    <app-notification-modal></app-notification-modal>
  `
})
export class App {}
