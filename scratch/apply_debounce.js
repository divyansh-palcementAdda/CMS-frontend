const fs = require('fs');
const path = require('path');

const applyDebounce = (filePath, fetchMethodName, pageVarName, searchVarName) => {
  let content = fs.readFileSync(filePath, 'utf8');

  // Add Subject imports if not exists
  if (!content.includes('import { Subject')) {
    content = content.replace(/import {([^}]+)} from '@angular\/core';/, "import { $1 } from '@angular/core';\nimport { Subject } from 'rxjs';\nimport { debounceTime, distinctUntilChanged } from 'rxjs/operators';");
  } else if (!content.includes('debounceTime')) {
     // fallback if rxjs imports differ
     content = "import { Subject } from 'rxjs';\nimport { debounceTime, distinctUntilChanged } from 'rxjs/operators';\n" + content;
  }

  // Add searchSubject class variable
  if (!content.includes('searchSubject = new Subject<string>()')) {
    content = content.replace(
      /export class [a-zA-Z]+Component (implements [a-zA-Z]+ )?{/,
      `$&\n  private searchSubject = new Subject<string>();`
    );
  }

  // Hook into ngOnInit
  if (content.includes('ngOnInit(): void {')) {
    content = content.replace(
      /ngOnInit\(\): void {/,
      `ngOnInit(): void {\n    this.searchSubject.pipe(\n      debounceTime(500),\n      distinctUntilChanged()\n    ).subscribe((term) => {\n      this.${searchVarName} = term;\n      this.${pageVarName} = 1;\n      this.${fetchMethodName}();\n    });`
    );
  } else if (content.includes('ngOnInit() {')) {
    content = content.replace(
      /ngOnInit\(\) {/,
      `ngOnInit() {\n    this.searchSubject.pipe(\n      debounceTime(500),\n      distinctUntilChanged()\n    ).subscribe((term) => {\n      this.${searchVarName} = term;\n      this.${pageVarName} = 1;\n      this.${fetchMethodName}();\n    });`
    );
  }

  // Modify onSearchChange
  content = content.replace(
    /onSearchChange\(\): void {\s*this\.[a-zA-Z]+ = 1;\s*this\.[a-zA-Z]+\(\);\s*}/g,
    `onSearchChange(term?: string): void {\n    if (term !== undefined) { this.${searchVarName} = term; }\n    this.searchSubject.next(this.${searchVarName});\n  }`
  );
  content = content.replace(
    /onSearchChange\(\) {\s*this\.[a-zA-Z]+ = 1;\s*this\.[a-zA-Z]+\(\);\s*}/g,
    `onSearchChange(term?: string) {\n    if (term !== undefined) { this.${searchVarName} = term; }\n    this.searchSubject.next(this.${searchVarName});\n  }`
  );

  fs.writeFileSync(filePath, content);
};

// 1. User Management
const userMgmt = path.join('c:', 'Users', 'DELL', 'OneDrive', 'Desktop', 'CMS (production)', 'CMS-frontend', 'src', 'app', 'features', 'user-management', 'user-management.component.ts');
applyDebounce(userMgmt, 'fetchUsers', 'currentPage', 'searchTerm');

// 2. Course Management
const courseMgmt = path.join('c:', 'Users', 'DELL', 'OneDrive', 'Desktop', 'CMS (production)', 'CMS-frontend', 'src', 'app', 'features', 'course-management', 'course-management.component.ts');
applyDebounce(courseMgmt, 'fetchCourses', 'currentPage', 'searchTerm');

// 3. Consultancy Management
const consMgmt = path.join('c:', 'Users', 'DELL', 'OneDrive', 'Desktop', 'CMS (production)', 'CMS-frontend', 'src', 'app', 'features', 'consultancy-management', 'consultancy-management.component.ts');
applyDebounce(consMgmt, 'fetchConsultancies', 'page', 'searchTerm');

console.log("Debounce successfully applied to management components.");
