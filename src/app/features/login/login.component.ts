import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-logo">LOGO</div>
        <h2>Welcome Back</h2>
        <p class="subtitle">Sign in to your CMS account</p>

        <div *ngIf="error()" class="error-msg">{{ error() }}</div>

        <form (ngSubmit)="onSubmit()" #f="ngForm">
          <div class="field">
            <label>Username or Email</label>
            <input type="text" [(ngModel)]="emailOrUsername" name="emailOrUsername"
              placeholder="Enter username or email" required />
          </div>
          <div class="field">
            <label>Password</label>
            <input type="password" [(ngModel)]="password" name="password"
              placeholder="Enter password" required />
          </div>
          <button type="submit" class="login-btn" [disabled]="loading()">
            {{ loading() ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex; align-items: center; justify-content: center;
    }
    .login-card {
      background: white; border-radius: 16px; padding: 40px;
      width: 100%; max-width: 400px; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    }
    .login-logo {
      font-size: 24px; font-weight: 800; letter-spacing: 2px;
      color: #667eea; margin-bottom: 24px; text-align: center;
    }
    h2 { font-size: 22px; font-weight: 700; color: #1a1a2e; margin: 0 0 6px; text-align: center; }
    .subtitle { color: #6b7280; font-size: 14px; text-align: center; margin: 0 0 28px; }
    .error-msg {
      background: #fee2e2; color: #dc2626; padding: 10px 14px;
      border-radius: 8px; font-size: 13px; margin-bottom: 16px;
    }
    .field { margin-bottom: 18px; }
    label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
    input {
      width: 100%; padding: 10px 14px; border: 1px solid #e5e7eb;
      border-radius: 8px; font-size: 14px; outline: none; box-sizing: border-box;
      transition: border-color 0.2s;
      &:focus { border-color: #667eea; }
    }
    .login-btn {
      width: 100%; padding: 12px; background: linear-gradient(135deg, #667eea, #764ba2);
      color: white; border: none; border-radius: 8px; font-size: 15px;
      font-weight: 600; cursor: pointer; transition: opacity 0.2s;
      &:disabled { opacity: 0.7; cursor: not-allowed; }
    }
  `]
})
export class LoginComponent {
  emailOrUsername = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit(): void {
    if (!this.emailOrUsername || !this.password) return;
    this.loading.set(true);
    this.error.set(null);

    this.auth.login({ emailOrUsername: this.emailOrUsername, password: this.password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Login failed');
      }
    });
  }
}
