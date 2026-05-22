const fs = require('fs');
const path = require('path');
const file = path.join('c:', 'Users', 'DELL', 'OneDrive', 'Desktop', 'CMS (production)', 'CMS-frontend', 'src', 'app', 'features', 'course-detail', 'course-detail.component.html');
let content = fs.readFileSync(file, 'utf8');

// 1. Fix lengths
const mapping = {
  'filteredMasterList.length': 'masterTotal',
  'filteredTotalApplications.length': 'totalAppTotal',
  'filteredCancelledApplications.length': 'cancelledAppTotal',
  'filteredTotalAdmissions.length': 'totalAdmTotal',
  'filteredCancelledAdmissions.length': 'cancelledAdmTotal',
  'filteredConsultancies.length': 'consTotal',
  'filteredInstitutions.length': 'instTotal'
};
for (const [key, value] of Object.entries(mapping)) {
  content = content.split(key).join(value);
}

// Master Table
content = content.replace(
  /<input type="text" placeholder="Search" \[\(ngModel\)\]="masterSearch">/g,
  `<input type="text" placeholder="Search" [(ngModel)]="masterSearch" (ngModelChange)="onMasterSearchChange()">`
);
content = content.replace(
  /(\[\(ngModel\)\]="masterSearch" \(ngModelChange\)="onMasterSearchChange\(\)">\s*<svg[^>]+>[\s\S]*?<\/svg>\s*<\/div>)/g,
  `$1\n                <button class="btn primary" (click)="exportExcel('remaining_applications')" [disabled]="exporting['remaining_applications']">\n                  <i class="bx" [ngClass]="exporting['remaining_applications'] ? 'bx-loader-alt bx-spin' : 'bx-export'"></i>\n                  {{ exporting['remaining_applications'] ? 'Exporting...' : 'Export' }}\n                </button>`
);

// Total Applications Table
content = content.replace(
  /<input type="text" placeholder="Search Applications" \[\(ngModel\)\]="totalAppSearch">/g,
  `<input type="text" placeholder="Search Applications" [(ngModel)]="totalAppSearch" (ngModelChange)="onTotalAppSearchChange()">`
);
content = content.replace(
  /(\[\(ngModel\)\]="totalAppSearch" \(ngModelChange\)="onTotalAppSearchChange\(\)">\s*<svg[^>]+>[\s\S]*?<\/svg>\s*<\/div>)/g,
  `$1\n                <button class="btn primary" (click)="exportExcel('total_applications')" [disabled]="exporting['total_applications']">\n                  <i class="bx" [ngClass]="exporting['total_applications'] ? 'bx-loader-alt bx-spin' : 'bx-export'"></i>\n                  {{ exporting['total_applications'] ? 'Exporting...' : 'Export' }}\n                </button>`
);

// Cancelled Applications Table
content = content.replace(
  /<input type="text" placeholder="Search Applications" \[\(ngModel\)\]="cancelledAppSearch">/g,
  `<input type="text" placeholder="Search Applications" [(ngModel)]="cancelledAppSearch" (ngModelChange)="onCancelledAppSearchChange()">`
);
content = content.replace(
  /(\[\(ngModel\)\]="cancelledAppSearch" \(ngModelChange\)="onCancelledAppSearchChange\(\)">\s*<svg[^>]+>[\s\S]*?<\/svg>\s*<\/div>)/g,
  `$1\n                <button class="btn primary" (click)="exportExcel('cancelled_applications')" [disabled]="exporting['cancelled_applications']">\n                  <i class="bx" [ngClass]="exporting['cancelled_applications'] ? 'bx-loader-alt bx-spin' : 'bx-export'"></i>\n                  {{ exporting['cancelled_applications'] ? 'Exporting...' : 'Export' }}\n                </button>`
);

// Total Admissions Table
content = content.replace(
  /<input type="text" placeholder="Search Admissions" \[\(ngModel\)\]="totalAdmSearch">/g,
  `<input type="text" placeholder="Search Admissions" [(ngModel)]="totalAdmSearch" (ngModelChange)="onTotalAdmSearchChange()">`
);
content = content.replace(
  /(\[\(ngModel\)\]="totalAdmSearch" \(ngModelChange\)="onTotalAdmSearchChange\(\)">\s*<svg[^>]+>[\s\S]*?<\/svg>\s*<\/div>)/g,
  `$1\n                <button class="btn primary" (click)="exportExcel('confirmed_admissions')" [disabled]="exporting['confirmed_admissions']">\n                  <i class="bx" [ngClass]="exporting['confirmed_admissions'] ? 'bx-loader-alt bx-spin' : 'bx-export'"></i>\n                  {{ exporting['confirmed_admissions'] ? 'Exporting...' : 'Export' }}\n                </button>`
);

// Cancelled Admissions Table
content = content.replace(
  /<input type="text" placeholder="Search Admissions" \[\(ngModel\)\]="cancelledAdmSearch">/g,
  `<input type="text" placeholder="Search Admissions" [(ngModel)]="cancelledAdmSearch" (ngModelChange)="onCancelledAdmSearchChange()">`
);
content = content.replace(
  /(\[\(ngModel\)\]="cancelledAdmSearch" \(ngModelChange\)="onCancelledAdmSearchChange\(\)">\s*<svg[^>]+>[\s\S]*?<\/svg>\s*<\/div>)/g,
  `$1\n                <button class="btn primary" (click)="exportExcel('cancelled_admissions')" [disabled]="exporting['cancelled_admissions']">\n                  <i class="bx" [ngClass]="exporting['cancelled_admissions'] ? 'bx-loader-alt bx-spin' : 'bx-export'"></i>\n                  {{ exporting['cancelled_admissions'] ? 'Exporting...' : 'Export' }}\n                </button>`
);

// Consultancy Table
content = content.replace(
  /<input type="text" placeholder="Search Consultancy" \[\(ngModel\)\]="consSearch">/g,
  `<input type="text" placeholder="Search Consultancy" [(ngModel)]="consSearch" (ngModelChange)="onConsSearchChange()">`
);

// Institution Table
content = content.replace(
  /<input type="text" placeholder="Search Institution" \[\(ngModel\)\]="searchTerm">/g,
  `<input type="text" placeholder="Search Institution" [(ngModel)]="instSearch" (ngModelChange)="onInstSearchChange()">`
);

fs.writeFileSync(file, content);
console.log("Fixes applied successfully.");
