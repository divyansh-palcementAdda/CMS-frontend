import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed()">
      <div class="sidebar-logo-area">
        <span class="sidebar-logo-text" *ngIf="!collapsed()">LOGO</span>
        <button class="sidebar-collapse-btn" (click)="toggleCollapse()">◀</button>
      </div>
      <nav class="sidebar-nav">
        <ul class="sidebar-menu">
          <li *ngFor="let item of navItems" class="sidebar-menu-item">
            <a [routerLink]="item.path" routerLinkActive="active"
               class="sidebar-menu-link" [title]="item.label">
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-label" *ngIf="!collapsed()">{{ item.label }}</span>
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  `,
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  collapsed = signal(false);

  navItems = [
    { label: 'Dashboard', icon: '⊞', path: '/admin/dashboard' },
    { label: 'Users', icon: '👤', path: '/users' },
    { label: 'Institution', icon: '🏛', path: '/institutions' },
    { label: 'Roles', icon: '🛡', path: '/roles' },
    { label: 'Courses', icon: '📚', path: '/courses' },
    { label: 'Course Type', icon: '📋', path: '/course-types' },
    { label: 'Consultancy', icon: '💼', path: '/consultancy' },
    { label: 'Admission', icon: '🎓', path: '/admin/admission-management' },
    { label: 'Settings', icon: '⚙', path: '/settings' },
  ];

  constructor(private auth: AuthService) { }
  toggleCollapse(): void { this.collapsed.update(v => !v); }
}
