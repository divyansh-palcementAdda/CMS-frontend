import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="unauth-page">
      <div class="unauth-card">
        <div class="icon">🚫</div>
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
        <a routerLink="/login" class="back-btn">Back to Login</a>
      </div>
    </div>
  `,
  styles: [`
    .unauth-page {
      min-height: 100vh;
      background: #f0f2f5;
      display: flex; align-items: center; justify-content: center;
    }
    .unauth-card {
      background: white; border-radius: 16px; padding: 48px;
      text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    .icon { font-size: 64px; margin-bottom: 16px; }
    h2 { font-size: 24px; font-weight: 700; color: #1a1a2e; margin: 0 0 8px; }
    p { color: #6b7280; font-size: 14px; margin: 0 0 24px; }
    .back-btn {
      display: inline-block; padding: 10px 24px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white; border-radius: 8px; text-decoration: none;
      font-size: 14px; font-weight: 600;
    }
  `]
})
export class UnauthorizedComponent {}
