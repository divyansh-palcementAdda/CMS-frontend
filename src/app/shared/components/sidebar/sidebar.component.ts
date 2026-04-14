import { Component, signal, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface NavItem {
  label: string;
  icon: string | SafeHtml;
  path: string;
  queryParams?: any;
}

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
            <a [routerLink]="item.path" 
               [queryParams]="item.queryParams"
               routerLinkActive="active"
               class="sidebar-menu-link" [title]="item.label">
              <span class="nav-icon" [innerHTML]="item.icon"></span>
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
  private sanitizer = inject(DomSanitizer);

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: this.sanitizer.bypassSecurityTrustHtml(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M14 9q-.425 0-.712-.288T13 8V4q0-.425.288-.712T14 3h6q.425 0 .713.288T21 4v4q0 .425-.288.713T20 9zM4 13q-.425 0-.712-.288T3 12V4q0-.425.288-.712T4 3h6q.425 0 .713.288T11 4v8q0 .425-.288.713T10 13zm10 8q-.425 0-.712-.288T13 20v-8q0-.425.288-.712T14 11h6q.425 0 .713.288T21 12v8q0 .425-.288.713T20 21zM4 21q-.425 0-.712-.288T3 20v-4q0-.425.288-.712T4 15h6q.425 0 .713.288T11 16v4q0 .425-.288.713T10 21z"/></svg>`), path: '/admin/dashboard' },
    { label: 'Users', icon: this.sanitizer.bypassSecurityTrustHtml(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M16 17v2H2v-2s0-4 7-4s7 4 7 4m-3.5-9.5A3.5 3.5 0 1 0 9 11a3.5 3.5 0 0 0 3.5-3.5m3.44 5.5A5.32 5.32 0 0 1 18 17v2h4v-2s0-3.63-6.06-4M15 4a3.4 3.4 0 0 0-1.93.59a5 5 0 0 1 0 5.82A3.4 3.4 0 0 0 15 11a3.5 3.5 0 0 0 0-7"/></svg>`), path: '/users' },
    { label: 'Institution', icon: this.sanitizer.bypassSecurityTrustHtml(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="currentColor"><path d="m6 10.524l-2.27.638a1 1 0 0 0-.73.963V20a1 1 0 0 0 1 1h2zm12 0l2.27.638a1 1 0 0 1 .73.963V20a1 1 0 0 1-1 1h-2z"/><path fill-rule="evenodd" d="M12.555 3.168a1 1 0 0 0-1.11 0l-6 4a1 1 0 0 0 1.11 1.664L8 7.869V21h8V7.869l1.445.963A1 1 0 0 0 18 9a.999.999 0 0 0 .555-1.832zM10 12a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2h-2a1 1 0 0 1-1-1m1-4a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2z" clip-rule="evenodd"/></g></svg>`), path: '/institutions' },
    { label: 'Roles', icon: this.sanitizer.bypassSecurityTrustHtml(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 22q-3.475-.875-5.738-3.988T4 11.1V5l8-3l8 3v6.1q0 3.8-2.262 6.913T12 22"/></svg>`), path: '/roles' },
    { label: 'Courses', icon: this.sanitizer.bypassSecurityTrustHtml(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M21.5 5.134a1 1 0 0 1 .493.748L22 6v13a1 1 0 0 1-1.5.866A8 8 0 0 0 13 19.6V4.426a10 10 0 0 1 8.5.708M11 4.427l.001 15.174a8 8 0 0 0-7.234.117l-.327.18l-.103.044l-.049.016l-.11.026l-.061.01L3 20h-.042l-.11-.012l-.077-.014l-.108-.032l-.126-.056l-.095-.056l-.089-.067l-.06-.056l-.073-.082l-.064-.089l-.022-.036l-.032-.06l-.044-.103l-.016-.049l-.026-.11l-.01-.061l-.004-.049L2 6a1 1 0 0 1 .5-.866a10 10 0 0 1 8.5-.707"/></svg>`), path: '/courses' },
    { label: 'Course Type', icon: this.sanitizer.bypassSecurityTrustHtml(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M6 22q-.825 0-1.412-.587T4 20V4q0-.825.588-1.412T6 2h12q.825 0 1.413.588T20 4v16q0 .825-.587 1.413T18 22zm5-11l2.5-1.5L16 11V4h-5z"/></svg>`), path: '/course-types' },
    { label: 'Consultancy', icon: this.sanitizer.bypassSecurityTrustHtml(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M15 3a1 1 0 0 1 1 1v2h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5V4a1 1 0 0 1 1-1zM8 8H6v11h2zm10 0h-2v11h2zm-4-3h-4v1h4z"/></svg>`), path: '/consultancy' },
    { label: 'Admission', icon: this.sanitizer.bypassSecurityTrustHtml(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M15.775 18.525Q16 18.3 16 18t-.225-.525t-.525-.225t-.525.225T14.5 18t.225.525t.525.225t.525-.225m2.75 0q.225-.225.225-.525t-.225-.525T18 17.25t-.525.225t-.225.525t.225.525t.525.225t.525-.225m2.75 0Q21.5 18.3 21.5 18t-.225-.525t-.525-.225t-.525.225T20 18t.225.525t.525.225t.525-.225M18 23q-2.075 0-3.537-1.463T13 18t1.463-3.537T18 13t3.538 1.463T23 18t-1.463 3.538T18 23M7 9h10V7H7zm4.675 12H5q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v6.7q-.725-.35-1.463-.525T18 11q-.275 0-.513.012t-.487.063V11H7v2h6.125q-.45.425-.812.925T11.675 15H7v2h4.075q-.05.25-.062.488T11 18q0 .825.15 1.538T11.675 21"/></svg>`), path: '/admin/admission-management', queryParams: { tab: 'Admission' } },
    { label: 'Applications', icon: this.sanitizer.bypassSecurityTrustHtml(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M16 20h4v-4h-4zm0-6h4v-4h-4zm0-6h4V4h-4zm-6 12h4v-4h-4zm0-6h4v-4h-4zm0-6h4V4h-4zM4 20h4v-4H4zm0-6h4v-4H4zm0-6h4V4H4z"/></svg>`), path: '/admin/admission-management', queryParams: { tab: 'applications' } },
  ];

  constructor(private auth: AuthService) { }
  toggleCollapse(): void { this.collapsed.update(v => !v); }
}

