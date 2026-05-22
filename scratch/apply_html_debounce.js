const fs = require('fs');
const path = require('path');

const applyHtmlDebounce = (filePath, searchVarName) => {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace [(ngModel)]="searchTerm" with [ngModel]="searchTerm" (ngModelChange)="onSearchChange($event)"
  // But wait, the existing code might already have (ngModelChange)="onSearchChange()"
  const regex = new RegExp(`\\[\\(ngModel\\)\\]="${searchVarName}"(?:\\s*\\(ngModelChange\\)="onSearchChange\\(\\)")?`, 'g');
  content = content.replace(regex, `[ngModel]="${searchVarName}" (ngModelChange)="onSearchChange($event)"`);

  fs.writeFileSync(filePath, content);
};

// 1. User Management
const userMgmtHtml = path.join('c:', 'Users', 'DELL', 'OneDrive', 'Desktop', 'CMS (production)', 'CMS-frontend', 'src', 'app', 'features', 'user-management', 'user-management.component.html');
applyHtmlDebounce(userMgmtHtml, 'searchTerm');

// 2. Course Management
const courseMgmtHtml = path.join('c:', 'Users', 'DELL', 'OneDrive', 'Desktop', 'CMS (production)', 'CMS-frontend', 'src', 'app', 'features', 'course-management', 'course-management.component.html');
applyHtmlDebounce(courseMgmtHtml, 'searchTerm');

// 3. Consultancy Management
const consMgmtHtml = path.join('c:', 'Users', 'DELL', 'OneDrive', 'Desktop', 'CMS (production)', 'CMS-frontend', 'src', 'app', 'features', 'consultancy-management', 'consultancy-management.component.html');
applyHtmlDebounce(consMgmtHtml, 'searchTerm');

console.log("HTML Debounce successfully applied to management components.");
