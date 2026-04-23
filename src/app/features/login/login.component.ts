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
    <div class="login-container">
      <div class="bg-blobs">
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
        <div class="blob blob-3"></div>
      </div>
      
      <div class="login-card">
        <div class="login-header">
          <div class="logo-box">
            <img src="/assets/logo.png" alt="Logo" class="logo-img">
          </div>
          <h1 class="welcome-text">Welcome Back</h1>
          <p class="subtitle">Please enter your details to sign in</p>
        </div>

        <div *ngIf="error()" class="error-alert">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>{{ error() }}</span>
        </div>

        <form (ngSubmit)="onSubmit()" #f="ngForm" class="login-form">
          <div class="form-group">
            <label for="identity">Username or Email</label>
            <div class="input-wrapper">
              <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <input type="text" id="identity" [(ngModel)]="emailOrUsername" name="emailOrUsername"
                placeholder="john@example.com" required autocomplete="username" />
            </div>
          </div>

          <div class="form-group">
            <div class="input-wrapper">
              <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <input type="password" id="password" [(ngModel)]="password" name="password"
                placeholder="••••••••" required autocomplete="current-password" />
            </div>
          </div>

        

          <button type="submit" class="submit-btn" [disabled]="loading()">
            <span *ngIf="!loading()">Sign In</span>
            <div *ngIf="loading()" class="loader"></div>
          </button>
        </form>

        <p class="footer-text">
          Don't have an account? <a href="javascript:void(0)">Contact Administrator</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      position: relative;
      min-height: 100vh;
      width: 100%;
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      font-family: 'Inter', sans-serif;
    }

    .bg-blobs {
      position: absolute;
      width: 100%;
      height: 100%;
      z-index: 0;
    }

    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.4;
      z-index: -1;
      animation: float 20s infinite alternate ease-in-out;
    }

    .blob-1 {
      width: 400px;
      height: 400px;
      background: #7c3aed;
      top: -100px;
      right: -100px;
    }

    .blob-2 {
      width: 500px;
      height: 500px;
      background: #435fff;
      bottom: -150px;
      left: -150px;
      animation-delay: -5s;
    }

    .blob-3 {
      width: 300px;
      height: 300px;
      background: #ff41f8;
      top: 50%;
      left: 20%;
      animation-delay: -10s;
    }

    @keyframes float {
      0% { transform: translate(0, 0) scale(1); }
      100% { transform: translate(40px, 40px) scale(1.1); }
    }

    .login-card {
      position: relative;
      z-index: 10;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      padding: 64px 56px;
      border-radius: 32px;
      width: 100%;
      max-width: 540px;
      margin: 20px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.8);
    }

    .login-header {
      text-align: center;
      margin-bottom: 36px;
    }

    .logo-box {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 24px;
    }

    .logo-img {
      width: 300px;
      height: 150px;
      object-fit: contain;
      filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
    }

    .logo-text {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #7c3aed, #435fff);
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .welcome-text {
      font-size: 28px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }

    .subtitle {
      font-size: 15px;
      color: #64748b;
    }

    .error-alert {
      background: #fef2f2;
      border: 1px solid #fee2e2;
      color: #dc2626;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 24px;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from { transform: translateY(-10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .form-group {
      margin-bottom: 20px;
    }

    .label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    label {
      font-size: 14px;
      font-weight: 600;
      color: #334155;
    }

    .forgot-link {
      font-size: 13px;
      font-weight: 600;
      color: #7c3aed;
      text-decoration: none;
      transition: color 0.2s;
      &:hover { color: #435fff; }
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 16px;
      color: #94a3b8;
      transition: color 0.2s;
    }

    input[type="text"],
    input[type="password"] {
      width: 100%;
      padding: 12px 16px 12px 48px;
      background: #f1f5f9;
      border: 2px solid transparent;
      border-radius: 12px;
      font-size: 15px;
      color: #1e293b;
      outline: none;
      transition: all 0.2s ease;

      &::placeholder { color: #94a3b8; }

      &:focus {
        background: #ffffff;
        border-color: #7c3aed;
        box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1);
        
        & + .input-icon { color: #7c3aed; }
      }
    }

    .remember-me {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 28px;

      input[type="checkbox"] {
        width: 18px;
        height: 18px;
        border-radius: 4px;
        border: 2px solid #cbd5e1;
        cursor: pointer;
        accent-color: #7c3aed;
      }

      label {
        font-size: 14px;
        font-weight: 500;
        color: #64748b;
        cursor: pointer;
      }
    }

    .submit-btn {
      width: 100%;
      height: 48px;
      background: linear-gradient(135deg, #7c3aed, #435fff);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(124, 58, 237, 0.3);
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    }

    .loader {
      width: 20px;
      height: 20px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: #fff;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .footer-text {
      text-align: center;
      margin-top: 32px;
      font-size: 14px;
      color: #64748b;

      a {
        color: #7c3aed;
        font-weight: 600;
        text-decoration: none;
        &:hover { text-decoration: underline; }
      }
    }

    @media (max-width: 640px) {
      .login-card { 
        padding: 40px 24px; 
        margin: 16px;
        border-radius: 24px;
      }
      .welcome-text { font-size: 24px; }
      .logo-img { width: 36px; height: 36px; }
      .logo-text { font-size: 20px; }
    }
  `]

})
export class LoginComponent {
  emailOrUsername = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private auth: AuthService, private router: Router) { }

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
