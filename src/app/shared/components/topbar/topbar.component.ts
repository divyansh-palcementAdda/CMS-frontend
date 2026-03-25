import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="topbar">
      <div class="topbar-right">
        <div class="role-chips">
          <span class="role-chip active">Admin</span>
          <span class="role-chip">User</span>
          <span class="role-chip">Fee Dept</span>
        </div>
        <div class="avatar-wrap">
          <div class="avatar">{{ initials }}</div>
          <span class="avatar-caret">▾</span>
        </div>
      </div>
    </header>
  `,
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  constructor(private auth: AuthService) {}

  get initials(): string {
    const u = this.auth.user();
    const name = u?.fullName || u?.username || 'A';
    return name.slice(0, 2).toUpperCase();
  }
}
