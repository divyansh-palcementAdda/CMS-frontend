import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';

interface ProfileState {
  loading: boolean;
  saving: boolean;
  savingPassword: boolean;
  requestingEmailChange: boolean;
  verifyingOtp: boolean;
  resendingOtp: boolean;
  error: string | null;
  success: string | null;
  passwordError: string | null;
  passwordSuccess: string | null;
}

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, TopbarComponent],
  templateUrl: './my-profile.component.html',
  styleUrl: './my-profile.component.scss'
})
export class MyProfileComponent implements OnInit, OnDestroy {

  // ─── Profile Data ────────────────────────────────────────────────────────────
  profile: any = null;
  editFullName = '';
  editMobile = '';

  // ─── Email Change ────────────────────────────────────────────────────────────
  newEmailInput = '';
  emailChangeError = '';
  emailChangeSuccess = '';

  // ─── OTP Modal ───────────────────────────────────────────────────────────────
  showOtpModal = false;
  pendingEmail = '';
  otpInput = '';
  otpError = '';
  otpSuccess = '';
  resendCooldown = 0;
  private resendTimer: any = null;

  // ─── Password Change ─────────────────────────────────────────────────────────
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  showCurrentPw = false;
  showNewPw = false;
  showConfirmPw = false;

  // ─── Active Devices & Login History ─────────────────────────────────────────
  activeDevices: any[] = [];
  loginActivities: any[] = [];
  loadingDevices = false;
  loadingActivities = false;
  showLogoutAllModal = false;

  // ─── UI State ────────────────────────────────────────────────────────────────
  state: ProfileState = {
    loading: true,
    saving: false,
    savingPassword: false,
    requestingEmailChange: false,
    verifyingOtp: false,
    resendingOtp: false,
    error: null,
    success: null,
    passwordError: null,
    passwordSuccess: null
  };

  activeSection: 'overview' | 'personal' | 'account' | 'security' | 'devices' | 'history' = 'overview';

  constructor(private userService: UserService, private authService: AuthService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  ngOnDestroy(): void {
    if (this.resendTimer) clearInterval(this.resendTimer);
  }

  // ─── Load Profile ─────────────────────────────────────────────────────────────
  loadProfile(): void {
    this.state.loading = true;
    this.state.error = null;

    this.userService.getMyProfile().subscribe({
      next: (res: any) => {
        const data = res?.data || res;
        // Use basicInfo if it's a detail response
        this.profile = data?.basicInfo || data;
        this.editFullName = this.profile?.fullName || '';
        this.editMobile = this.profile?.mobile || '';
        this.state.loading = false;
      },
      error: (err: any) => {
        this.state.error = err?.error?.message || 'Failed to load profile. Please try again.';
        this.state.loading = false;
      }
    });
  }

  // ─── Profile Save (Name + Mobile only) ───────────────────────────────────────
  saveProfile(): void {
    if (!this.editFullName.trim()) {
      this.state.error = 'Full name is required.';
      return;
    }
    this.state.saving = true;
    this.state.error = null;
    this.state.success = null;

    this.userService.updateMyProfile({
      fullName: this.editFullName.trim(),
      mobile: this.editMobile.trim() || undefined
    }).subscribe({
      next: (res: any) => {
        const updated = res?.data || res;
        this.profile = { ...this.profile, fullName: updated?.fullName || this.editFullName, mobile: updated?.mobile || this.editMobile };
        this.state.success = 'Profile updated successfully.';
        this.state.saving = false;
        this.autoHideSuccess();
      },
      error: (err: any) => {
        this.state.error = err?.error?.message || 'Failed to save profile. Please try again.';
        this.state.saving = false;
      }
    });
  }

  // ─── Email Change Request ─────────────────────────────────────────────────────
  requestEmailChange(): void {
    this.emailChangeError = '';
    this.emailChangeSuccess = '';

    const trimmed = this.newEmailInput.trim().toLowerCase();
    if (!trimmed) {
      this.emailChangeError = 'Please enter a new email address.';
      return;
    }
    if (!this.isValidEmail(trimmed)) {
      this.emailChangeError = 'Please enter a valid email address.';
      return;
    }
    if (trimmed === (this.profile?.email || '').toLowerCase()) {
      this.emailChangeError = 'New email must be different from your current email.';
      return;
    }

    this.state.requestingEmailChange = true;

    this.userService.requestEmailChange({ newEmail: trimmed }).subscribe({
      next: () => {
        this.pendingEmail = trimmed;
        this.state.requestingEmailChange = false;
        this.newEmailInput = '';
        this.otpInput = '';
        this.otpError = '';
        this.otpSuccess = '';
        this.showOtpModal = true;
        this.startResendCooldown();
      },
      error: (err: any) => {
        this.emailChangeError = err?.error?.message || 'Failed to send verification code. Please try again.';
        this.state.requestingEmailChange = false;
      }
    });
  }

  // ─── OTP Verify ───────────────────────────────────────────────────────────────
  verifyOtp(): void {
    this.otpError = '';
    this.otpSuccess = '';

    if (!this.otpInput.trim()) {
      this.otpError = 'Please enter the 6-digit verification code.';
      return;
    }
    if (!/^\d{6}$/.test(this.otpInput.trim())) {
      this.otpError = 'Verification code must be exactly 6 digits.';
      return;
    }

    this.state.verifyingOtp = true;

    this.userService.verifyEmailChange({ otp: this.otpInput.trim() }).subscribe({
      next: (res: any) => {
        const updated = res?.data || res;
        this.profile = {
          ...this.profile,
          email: updated?.email || this.pendingEmail,
          emailVerified: true,
          pendingEmail: null
        };
        this.state.verifyingOtp = false;
        this.otpSuccess = '✓ Email verified and updated successfully!';
        setTimeout(() => this.closeOtpModal(), 2000);
      },
      error: (err: any) => {
        this.otpError = err?.error?.message || 'Invalid or expired code. Please try again.';
        this.state.verifyingOtp = false;
      }
    });
  }

  // ─── Resend OTP ───────────────────────────────────────────────────────────────
  resendOtp(): void {
    if (this.resendCooldown > 0) return;
    this.state.resendingOtp = true;
    this.otpError = '';

    this.userService.resendEmailOtp().subscribe({
      next: () => {
        this.state.resendingOtp = false;
        this.otpInput = '';
        this.otpError = '';
        this.startResendCooldown();
      },
      error: (err: any) => {
        this.otpError = err?.error?.message || 'Failed to resend code. Please try again.';
        this.state.resendingOtp = false;
      }
    });
  }

  private startResendCooldown(): void {
    this.resendCooldown = 60;
    if (this.resendTimer) clearInterval(this.resendTimer);
    this.resendTimer = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        clearInterval(this.resendTimer);
        this.resendTimer = null;
      }
    }, 1000);
  }

  closeOtpModal(): void {
    this.showOtpModal = false;
    this.otpInput = '';
    this.otpError = '';
    this.otpSuccess = '';
  }

  // ─── Password Change ──────────────────────────────────────────────────────────
  changePassword(): void {
    this.state.passwordError = null;
    this.state.passwordSuccess = null;

    if (!this.currentPassword) {
      this.state.passwordError = 'Current password is required.';
      return;
    }
    if (!this.newPassword || this.newPassword.length < 8) {
      this.state.passwordError = 'New password must be at least 8 characters.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.state.passwordError = 'New password and confirm password do not match.';
      return;
    }
    if (this.newPassword === this.currentPassword) {
      this.state.passwordError = 'New password must be different from the current password.';
      return;
    }

    this.state.savingPassword = true;

    this.userService.changeMyPassword({
      currentPassword: this.currentPassword,
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword
    }).subscribe({
      next: () => {
        this.state.savingPassword = false;
        this.state.passwordSuccess = 'Password changed successfully.';
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.autoHidePasswordSuccess();
      },
      error: (err: any) => {
        this.state.passwordError = err?.error?.message || 'Failed to change password. Please try again.';
        this.state.savingPassword = false;
      }
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  get userInitials(): string {
    const name = this.profile?.fullName || this.profile?.username || 'U';
    return name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  }

  get displayRoles(): string {
    const roles = this.profile?.roles;
    if (!roles || roles.length === 0) return 'User';
    if (Array.isArray(roles)) {
      return roles.map((r: any) => {
        const name = typeof r === 'string' ? r : (r.name || r.rawName || '');
        return name.replace('ROLE_', '').replace(/_/g, ' ');
      }).join(', ');
    }
    return 'User';
  }

  get isPendingEmailChange(): boolean {
    return !!(this.profile?.pendingEmail);
  }

  get isEmailVerified(): boolean {
    return !!(this.profile?.emailVerified);
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private autoHideSuccess(): void {
    setTimeout(() => { this.state.success = null; }, 4000);
  }

  private autoHidePasswordSuccess(): void {
    setTimeout(() => { this.state.passwordSuccess = null; }, 4000);
  }

  dismissAlert(): void {
    this.state.error = null;
    this.state.success = null;
  }

  switchSection(section: 'overview' | 'personal' | 'account' | 'security' | 'devices' | 'history'): void {
    this.activeSection = section;
    this.state.error = null;
    this.state.success = null;
    this.emailChangeError = '';
    this.emailChangeSuccess = '';

    if (section === 'devices') {
      this.loadDevices();
    } else if (section === 'history') {
      this.loadActivities();
    } else if (section === 'overview') {
      this.loadProfile();
    }
  }

  loadDevices(): void {
    this.loadingDevices = true;
    this.userService.getMyDevices().subscribe({
      next: (res: any) => {
        this.activeDevices = res?.data || res || [];
        this.loadingDevices = false;
      },
      error: (err: any) => {
        console.error('Failed to load active devices', err);
        this.loadingDevices = false;
      }
    });
  }

  loadActivities(): void {
    this.loadingActivities = true;
    this.userService.getMyLoginActivities().subscribe({
      next: (res: any) => {
        this.loginActivities = res?.data || res || [];
        this.loadingActivities = false;
      },
      error: (err: any) => {
        console.error('Failed to load login activities', err);
        this.loadingActivities = false;
      }
    });
  }

  logoutDevice(deviceId: number, isCurrent: boolean): void {
    if (confirm(isCurrent ? 'Are you sure you want to log out of your current device?' : 'Are you sure you want to terminate this device session?')) {
      this.userService.logoutDevice(deviceId).subscribe({
        next: () => {
          if (isCurrent) {
            this.authService.logout();
          } else {
            this.state.success = 'Session terminated successfully.';
            this.loadDevices();
            this.autoHideSuccess();
          }
        },
        error: (err: any) => {
          this.state.error = err?.error?.message || 'Failed to terminate session. Please try again.';
        }
      });
    }
  }

  logoutAllDevices(): void {
    this.showLogoutAllModal = false;
    this.authService.logoutAllDevices();
  }

  formatDate(date: string | null, fallback: string): string {
    return this.userService.formatDate(date, fallback);
  }
}
