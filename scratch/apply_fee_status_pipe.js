const fs = require('fs');
const path = require('path');
const file = path.join('c:', 'Users', 'DELL', 'OneDrive', 'Desktop', 'CMS (production)', 'CMS-frontend', 'src', 'app', 'features', 'course-detail', 'course-detail.component.html');
let content = fs.readFileSync(file, 'utf8');

// The pattern to replace:
// <span class="status-badge"
//   [class.fee-status-unpaid]="item.feeStatus === 'UNPAID'"
//   [class.fee-status-provisional]="item.feeStatus === 'PROVISIONAL PAID'"
//   [class.fee-status-fifty]="item.feeStatus === '50% FEES PAID'">{{ item.feeStatus }}</span>

const regex = /<span class="status-badge"\s*\[class\.fee-status-unpaid\]="item\.feeStatus === 'UNPAID'"\s*\[class\.fee-status-provisional\]="item\.feeStatus === 'PROVISIONAL PAID'"\s*\[class\.fee-status-fifty\]="item\.feeStatus === '50% FEES PAID'">\{\{\s*item\.feeStatus\s*\}\}<\/span>/g;

content = content.replace(regex, `<span class="fee-status-badge status-badge" [ngClass]="item.feeStatus | feeStatusClass">{{ item.feeStatus }}</span>`);

fs.writeFileSync(file, content);
console.log("FeeStatusClassPipe applied to course-detail.component.html");
