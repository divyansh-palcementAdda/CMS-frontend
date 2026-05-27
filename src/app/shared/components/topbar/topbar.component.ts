import { Component, HostListener } from '@angular/core';
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
        <div class="avatar-wrap" (click)="toggleDropdown($event)">
          <div class="avatar">{{ initials }}</div>
          <span class="avatar-caret" [class.open]="isDropdownOpen">▾</span>
        </div>

        <!-- Profile Dropdown Menu -->
        <div class="profile-dropdown" *ngIf="isDropdownOpen" (click)="$event.stopPropagation()">
          <div class="dropdown-header">
            <span class="header-username">{{ username }}</span>
            <span class="header-email">{{ email }}</span>
          </div>
          <div class="dropdown-divider"></div>
          <ul class="dropdown-menu">
            <li class="menu-item">
              <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span>Profile</span>
            </li>
            <li class="menu-item">
              <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              <span>Settings</span>
            </li>
            <div class="dropdown-divider"></div>
            <li class="menu-item logout-item" (click)="openLogoutThisDeviceModal()">
              <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span>Logout from This Device</span>
            </li>
            <li class="menu-item logout-item danger-item" (click)="openLogoutAllDevicesModal()">
              <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
              <span>Logout from All Devices</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Glassmorphic Modal: Logout from This Device -->
      <div class="modal-overlay" *ngIf="showLogoutThisDeviceModal" (click)="closeModals()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-icon-wrap warning">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h3>Logout Current Device</h3>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to logout from this device?</p>
          </div>
          <div class="modal-actions">
            <button class="modal-btn cancel" (click)="closeModals()">Cancel</button>
            <button class="modal-btn confirm" (click)="confirmLogoutThisDevice()">Logout</button>
          </div>
        </div>
      </div>

      <!-- Glassmorphic Modal: Logout from All Devices -->
      <div class="modal-overlay" *ngIf="showLogoutAllDevicesModal" (click)="closeModals()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-icon-wrap danger">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
            </div>
            <h3>Logout All Devices</h3>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to logout from all devices?</p>
            <span class="warning-subtext">This will end all active sessions.</span>
          </div>
          <div class="modal-actions">
            <button class="modal-btn cancel" (click)="closeModals()">Cancel</button>
            <button class="modal-btn confirm-danger" (click)="confirmLogoutAllDevices()">Logout All</button>
          </div>
        </div>
      </div>
    </header>
  `,
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  isDropdownOpen = false;
  showLogoutThisDeviceModal = false;
  showLogoutAllDevicesModal = false;

  constructor(private auth: AuthService) { }

  get initials(): string {
    const u = this.auth.user();
    const name = u?.username || 'A';
    return name.slice(0, 2).toUpperCase();
  }

  get username(): string {
    return this.auth.user()?.username || 'User';
  }

  get email(): string {
    return this.auth.user()?.email || '';
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  closeDropdown(event: Event): void {
    this.isDropdownOpen = false;
  }

  openLogoutThisDeviceModal(): void {
    this.isDropdownOpen = false;
    this.showLogoutThisDeviceModal = true;
  }

  openLogoutAllDevicesModal(): void {
    this.isDropdownOpen = false;
    this.showLogoutAllDevicesModal = true;
  }

  closeModals(): void {
    this.showLogoutThisDeviceModal = false;
    this.showLogoutAllDevicesModal = false;
  }

  confirmLogoutThisDevice(): void {
    this.closeModals();
    this.auth.logout();
  }

  confirmLogoutAllDevices(): void {
    this.closeModals();
    this.auth.logoutAllDevices();
  }
}
