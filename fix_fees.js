const fs = require('fs');
const path = require('path');

function updateHtml(filepath) {
    if (!fs.existsSync(filepath)) {
        console.log(`File not found: ${filepath}`);
        return;
    }

    let content = fs.readFileSync(filepath, 'utf-8');

    // Replace Course Detail old logic
    const oldClassLogic = /\[class\.fee-status-unpaid\]="[^"]+"\s*\[class\.fee-status-provisional\]="[^"]+"\s*\[class\.fee-status-fifty\]="[^"]+"/g;
    content = content.replace(oldClassLogic, '[ngClass]="item.feeStatus | feeStatusClass"');
    
    // Convert status-badge to fee-status-badge in Course Detail
    content = content.replace(/class="status-badge" \[ngClass\]="item\.feeStatus \| feeStatusClass"/g, 'class="fee-status-badge" [ngClass]="item.feeStatus | feeStatusClass"');

    // Replace Consultancy/User Detail fallback logic
    // Pattern: [ngClass]="item.totalFeesPaid && item.totalFeesPaid > 0 ? 'active' : 'pending'"> ... {{ item.totalFeesPaid && item.totalFeesPaid > 0 ? 'Admission' : 'Application' }}
    const badLogicPattern = /\[ngClass\]="item\.totalFeesPaid && item\.totalFeesPaid > 0 \? 'active' : 'pending'">\s*\{\{\s*item\.totalFeesPaid && item\.totalFeesPaid > 0 \? 'Admission' : 'Application'\s*\}\}/g;
    content = content.replace(badLogicPattern, '[ngClass]="item.feeStatus | feeStatusClass">{{ item.feeStatus }}');

    fs.writeFileSync(filepath, content, 'utf-8');
    console.log(`Updated ${filepath}`);
}

const baseDir = path.join('.', 'src', 'app', 'features');
updateHtml(path.join(baseDir, 'course-detail', 'course-detail.component.html'));
updateHtml(path.join(baseDir, 'consultancy-detail', 'consultancy-detail.component.html'));
updateHtml(path.join(baseDir, 'user-detail', 'user-detail.component.html'));
