import { Component, Input, Output, EventEmitter, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-filter-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="filter-drawer-overlay" [class.show]="isOpen" (click)="close.emit()"></div>
    <div class="filter-drawer" [class.show]="isOpen">
      <div class="drawer-header">
        <div class="header-left">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"></path>
          </svg>
          <h3>Filters</h3>
        </div>
        <button class="close-btn" (click)="close.emit()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="drawer-content">
        <ng-content></ng-content>
      </div>

      <div class="drawer-footer">
        <button class="btn-clear" (click)="clear.emit()">Clear All</button>
        <button class="btn-apply" (click)="apply.emit()">Apply Filters</button>
      </div>
    </div>
  `,
  styles: [`
    .filter-drawer-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(4px);
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }
    .filter-drawer-overlay.show {
      opacity: 1;
      visibility: visible;
    }
    .filter-drawer {
      position: fixed;
      top: 0;
      right: -400px;
      width: 400px;
      height: 100vh;
      background: white;
      z-index: 1001;
      box-shadow: -10px 0 30px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .filter-drawer.show {
      right: 0;
    }
    .drawer-header {
      padding: 24px;
      border-bottom: 1px solid #F1F5F9;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #1E293B;
    }
    .header-left h3 {
      font-size: 20px;
      font-weight: 700;
      margin: 0;
    }
    .close-btn {
      background: #F8FAFC;
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      color: #64748B;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .close-btn:hover {
      background: #F1F5F9;
      color: #1E293B;
    }
    .drawer-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }
    .drawer-footer {
      padding: 24px;
      border-top: 1px solid #F1F5F9;
      display: flex;
      gap: 12px;
    }
    .btn-clear {
      flex: 1;
      padding: 12px;
      border: 1.5px solid #E2E8F0;
      background: white;
      color: #475569;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-clear:hover {
      background: #F8FAFC;
      border-color: #CBD5E1;
    }
    .btn-apply {
      flex: 2;
      padding: 12px;
      background: #6366F1;
      color: white;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
      transition: all 0.2s;
    }
    .btn-apply:hover {
      background: #4F46E5;
      transform: translateY(-1px);
      box-shadow: 0 6px 15px rgba(99, 102, 241, 0.3);
    }
    @media (max-width: 480px) {
      .filter-drawer {
        width: 100%;
        right: -100%;
      }
    }
  `]
})
export class FilterDrawerComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() apply = new EventEmitter<void>();
  @Output() clear = new EventEmitter<void>();
}
