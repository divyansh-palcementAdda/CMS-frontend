const fs = require('fs');
const path = require('path');

const fixHtmlDebounce = (filePath, searchVarName) => {
  let content = fs.readFileSync(filePath, 'utf8');

  // Revert [ngModel]="searchTerm" (ngModelChange)="onSearchChange($event)"
  // to [(ngModel)]="searchTerm" (ngModelChange)="onSearchChange()"
  const regex = new RegExp(`\\[ngModel\\]="${searchVarName}" \\(ngModelChange\\)="onSearchChange\\(\\$event\\)"`, 'g');
  content = content.replace(regex, `[(ngModel)]="${searchVarName}" (ngModelChange)="onSearchChange()"`);

  fs.writeFileSync(filePath, content);
};

// 1. User Management
const userMgmtHtml = path.join('c:', 'Users', 'DELL', 'OneDrive', 'Desktop', 'CMS (production)', 'CMS-frontend', 'src', 'app', 'features', 'user-management', 'user-management.component.html');
fixHtmlDebounce(userMgmtHtml, 'searchTerm');

// 2. Course Management
const courseMgmtHtml = path.join('c:', 'Users', 'DELL', 'OneDrive', 'Desktop', 'CMS (production)', 'CMS-frontend', 'src', 'app', 'features', 'course-management', 'course-management.component.html');
fixHtmlDebounce(courseMgmtHtml, 'searchTerm');

// 3. Consultancy Management
const consMgmtHtml = path.join('c:', 'Users', 'DELL', 'OneDrive', 'Desktop', 'CMS (production)', 'CMS-frontend', 'src', 'app', 'features', 'consultancy-management', 'consultancy-management.component.html');
fixHtmlDebounce(consMgmtHtml, 'searchTerm');

console.log("HTML Debounce successfully reverted to two-way binding with onSearchChange().");
