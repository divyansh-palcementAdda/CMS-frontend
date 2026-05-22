const fs = require('fs');
const path = require('path');
const file = path.join('c:', 'Users', 'DELL', 'OneDrive', 'Desktop', 'CMS (production)', 'CMS-frontend', 'src', 'app', 'features', 'course-detail', 'course-detail.component.html');
let content = fs.readFileSync(file, 'utf8');

// Cancelled Applications Table
content = content.replace(
  /<input type="text" placeholder="Search Cancelled" \[\(ngModel\)\]="cancelledAppSearch">/g,
  `<input type="text" placeholder="Search Cancelled" [(ngModel)]="cancelledAppSearch" (ngModelChange)="onCancelledAppSearchChange()">`
);
content = content.replace(
  /(\[\(ngModel\)\]="cancelledAppSearch" \(ngModelChange\)="onCancelledAppSearchChange\(\)">\s*<svg[^>]+>[\s\S]*?<\/svg>\s*<\/div>)/g,
  `$1\n                <button class="btn primary" (click)="exportExcel('cancelled_applications')" [disabled]="exporting['cancelled_applications']">\n                  <i class="bx" [ngClass]="exporting['cancelled_applications'] ? 'bx-loader-alt bx-spin' : 'bx-export'"></i>\n                  {{ exporting['cancelled_applications'] ? 'Exporting...' : 'Export' }}\n                </button>`
);

// Cancelled Admissions Table
content = content.replace(
  /<input type="text" placeholder="Search Cancelled" \[\(ngModel\)\]="cancelledAdmSearch">/g,
  `<input type="text" placeholder="Search Cancelled" [(ngModel)]="cancelledAdmSearch" (ngModelChange)="onCancelledAdmSearchChange()">`
);

// For Cancelled Admissions Table, the SVG might not be there or might be there. Wait, line 724 in view_file showed:
// <div class="search-box">
//   <input type="text" placeholder="Search Cancelled" [(ngModel)]="cancelledAdmSearch">
// </div>
// So there is NO SVG in the Cancelled Admissions table search box!
content = content.replace(
  /(\[\(ngModel\)\]="cancelledAdmSearch" \(ngModelChange\)="onCancelledAdmSearchChange\(\)">\s*<\/div>)/g,
  `$1\n                <button class="btn primary" (click)="exportExcel('cancelled_admissions')" [disabled]="exporting['cancelled_admissions']">\n                  <i class="bx" [ngClass]="exporting['cancelled_admissions'] ? 'bx-loader-alt bx-spin' : 'bx-export'"></i>\n                  {{ exporting['cancelled_admissions'] ? 'Exporting...' : 'Export' }}\n                </button>`
);

fs.writeFileSync(file, content);
console.log("Cancelled export buttons added successfully.");
