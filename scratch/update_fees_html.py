import re
import os

def update_html(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace manual inline logic with FeeStatusClassPipe
    # Find all instances of: [class.fee-status-unpaid]="item.feeStatus === 'UNPAID'" [class.fee-status-provisional]="item.feeStatus === 'PROVISIONAL PAID'" [class.fee-status-fifty]="item.feeStatus === '50% FEES PAID'"
    old_class_logic = r'\[class\.fee-status-unpaid\]="[^"]+"\s*\[class\.fee-status-provisional\]="[^"]+"\s*\[class\.fee-status-fifty\]="[^"]+"'
    content = re.sub(old_class_logic, '[ngClass]="item.feeStatus | feeStatusClass"', content)

    # In consultancy-detail and user-detail, there's fallback logic for fee status column:
    # <td><span class="status-badge" [ngClass]="item.totalFeesPaid && item.totalFeesPaid > 0 ? 'active' : 'pending'">{{ item.totalFeesPaid && item.totalFeesPaid > 0 ? 'Admission' : 'Application' }}</span></td>
    # Or similar structures. We should replace them.
    # Let's write a generic replacement for the Fee Status table data cells.

    # Instead of complex regex, let's just find `<td><span class="status-badge" [ngClass]="... ? 'active' : 'pending'">...</span></td>` under a Fee Status column?
    # Wait, it's easier to just do it via string replacements for the known patterns we found earlier.

    # Pattern 1: User / Consultancy detail bad logic:
    # [ngClass]="item.totalFeesPaid && item.totalFeesPaid > 0 ? 'active' : 'pending'">
    # {{ item.totalFeesPaid && item.totalFeesPaid > 0 ? 'Admission' : 'Application' }}
    bad_logic_1 = r'\[ngClass\]="item\.totalFeesPaid && item\.totalFeesPaid > 0 \? \'active\' : \'pending\'">\s*\{\{\s*item\.totalFeesPaid && item\.totalFeesPaid > 0 \? \'Admission\' : \'Application\'\s*\}\}'
    content = re.sub(bad_logic_1, '[ngClass]="item.feeStatus | feeStatusClass">{{ item.feeStatus }}', content)

    # Pattern 2: (just in case they used different spacing)
    content = content.replace(
        "[ngClass]=\"item.totalFeesPaid && item.totalFeesPaid > 0 ? 'active' : 'pending'\">\n                        {{ item.totalFeesPaid && item.totalFeesPaid > 0 ? 'Admission' : 'Application' }}",
        "[ngClass]=\"item.feeStatus | feeStatusClass\">{{ item.feeStatus }}"
    )

    # Pattern 3: Old status-badge logic in Course Detail
    content = content.replace('class="status-badge" [ngClass]="item.feeStatus | feeStatusClass"', 'class="fee-status-badge" [ngClass]="item.feeStatus | feeStatusClass"')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {filepath}")

# Update all 3 files
base_dir = r"c:\Users\DELL\OneDrive\Desktop\CMS (production)\CMS-frontend\src\app\features"
update_html(os.path.join(base_dir, "course-detail", "course-detail.component.html"))
update_html(os.path.join(base_dir, "consultancy-detail", "consultancy-detail.component.html"))
update_html(os.path.join(base_dir, "user-detail", "user-detail.component.html"))
