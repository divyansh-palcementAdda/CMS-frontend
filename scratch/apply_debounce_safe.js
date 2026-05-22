const fs = require('fs');
const path = require('path');

const applyDebounceSafely = (filePath, fetchMethodName, pageVarName, searchVarName) => {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add Subject import if needed
  if (!content.includes('import { Subject }')) {
    if (content.includes('import { Subscription }')) {
      content = content.replace(/import \{ Subscription \}/, 'import { Subscription, Subject }');
    } else {
      content = "import { Subject } from 'rxjs';\n" + content;
    }
  }

  // 2. Add debounceTime import if needed
  if (!content.includes('debounceTime')) {
    content = content.replace(/import \{ Subject \}[^\n]+\n/, "$&\nimport { debounceTime, distinctUntilChanged } from 'rxjs/operators';\n");
  }

  // 3. Add searchSubject property
  if (!content.includes('searchSubject = new Subject<string>()')) {
    content = content.replace(
      /export class [a-zA-Z]+Component[^\n]+\{\n/,
      "$&\n  private searchSubject = new Subject<string>();\n  private searchSub!: Subscription;\n"
    );
  }

  // 4. Update ngOnInit
  if (content.includes('ngOnInit() {')) {
    if (!content.includes('this.searchSubject.pipe')) {
      content = content.replace(
        /ngOnInit\(\) \{/,
        `ngOnInit() {\n    this.searchSub = this.searchSubject.pipe(\n      debounceTime(500),\n      distinctUntilChanged()\n    ).subscribe(() => {\n      this.${pageVarName} = 1;\n      this.${fetchMethodName}();\n    });`
      );
    }
  }

  // 5. Update onSearchChange
  // Find onSearchChange() { ... } and replace it
  const onSearchRegex = /onSearchChange\(\) \{\s*this\.[a-zA-Z]+ = 1;\s*this\.[a-zA-Z]+\(\);\s*\}/g;
  content = content.replace(onSearchRegex, `onSearchChange() {\n    this.searchSubject.next(this.${searchVarName});\n  }`);

  fs.writeFileSync(filePath, content);
};

// 1. User Management
const userMgmt = path.join('c:', 'Users', 'DELL', 'OneDrive', 'Desktop', 'CMS (production)', 'CMS-frontend', 'src', 'app', 'features', 'user-management', 'user-management.component.ts');
applyDebounceSafely(userMgmt, 'fetchData', 'currentPage', 'searchTerm');

// 2. Course Management
const courseMgmt = path.join('c:', 'Users', 'DELL', 'OneDrive', 'Desktop', 'CMS (production)', 'CMS-frontend', 'src', 'app', 'features', 'course-management', 'course-management.component.ts');
applyDebounceSafely(courseMgmt, 'fetchCourses', 'currentPage', 'searchTerm');

// 3. Consultancy Management
const consMgmt = path.join('c:', 'Users', 'DELL', 'OneDrive', 'Desktop', 'CMS (production)', 'CMS-frontend', 'src', 'app', 'features', 'consultancy-management', 'consultancy-management.component.ts');
applyDebounceSafely(consMgmt, 'fetchConsultancies', 'page', 'searchTerm');

console.log("Debounce safely applied to TypeScript files.");
