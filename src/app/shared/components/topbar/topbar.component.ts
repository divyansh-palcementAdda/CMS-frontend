import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="topbar">
      <div class="topbar-left-mobile">
        <img src="/assets/logo.png" alt="Logo" class="mobile-logo-img">
        <span class="mobile-logo-text">CMS</span>
      </div>
      <!-- add logo for desktop -->
      <div class="topbar-left-desktop">
        <img src="/assets/logo1.png" alt="Logo" class="desktop-logo-img">
        <span class="desktop-logo-text">Consultancy Management System</span>
      </div>
      <div class="topbar-right">
        <!-- <div class="role-chips">
          <span class="role-chip active">Admin</span>
          <span class="role-chip">User</span>
          <span class="role-chip">Fee Dept</span>
        </div> -->
        <div class="avatar-wrap">
          <div class="avatar">{{ initials }}</div>
          <!-- <span class="avatar-caret">▾</span> -->
        </div>
      </div>
    </header>
  `,
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  constructor(private auth: AuthService) { }

  get initials(): string {
    const u = this.auth.user();
    const name = u?.fullName || u?.username || 'A';
    return name.slice(0, 2).toUpperCase();
  }
}
