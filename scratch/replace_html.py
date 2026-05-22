import re
import sys

def process():
    try:
        with open('src/app/features/course-detail/course-detail.component.html', 'r', encoding='utf-8') as f:
            html = f.read()

        # 1. Master Table
        html = html.replace('[(ngModel)]="masterSearch"', '[(ngModel)]="masterSearch" (ngModelChange)="onMasterSearchChange()"')
        html = html.replace('[(ngModel)]="masterPageSize"', '[(ngModel)]="masterPageSize" (ngModelChange)="onMasterSizeChange()"')
        if '<button class="btn primary" (click)="exportExcel(\'remaining_applications\')"' not in html:
            html = html.replace(
                '<input type="text" placeholder="Search Master List" [(ngModel)]="masterSearch" (ngModelChange)="onMasterSearchChange()">',
                '<input type="text" placeholder="Search Master List" [(ngModel)]="masterSearch" (ngModelChange)="onMasterSearchChange()">\n                <button class="btn primary" (click)="exportExcel(\'remaining_applications\')" [disabled]="exporting[\'remaining_applications\']">\n                  <i class="bx" [ngClass]="exporting[\'remaining_applications\'] ? \'bx-loader-alt bx-spin\' : \'bx-export\'"></i>\n                  {{ exporting[\'remaining_applications\'] ? \'Exporting...\' : \'Export\' }}\n                </button>'
            )
        html = html.replace('filteredMasterList.length', 'masterTotal')
        html = html.replace('paginatedMasterList', 'paginatedMasterList()')
        html = re.sub(r'\(click\)="masterPage = 1"', r'(click)="masterPage = 1; fetchCourseStudents(\'remaining_applications\')"', html)
        html = re.sub(r'\(click\)="changePage\(\'master\', -1\)"', r'(click)="changeMasterPage(-1)"', html)
        html = re.sub(r'\(click\)="changePage\(\'master\', 1\)"', r'(click)="changeMasterPage(1)"', html)
        html = re.sub(r'\(click\)="masterPage = getTotalPages\(.*?\)"', r'(click)="masterPage = getTotalPages(masterTotal, masterPageSize); fetchCourseStudents(\'remaining_applications\')"', html)
        
        # Add sorting to headers (Master)
        html = re.sub(r'<th>Date of App</th>', r'<th class="sortable" (click)="sortMaster(\'date\')">Date of App <i class="bx" [ngClass]="getMasterSortIcon(\'date\')"></i></th>', html)
        html = re.sub(r'<th>Student Name</th>', r'<th class="sortable" (click)="sortMaster(\'name\')">Student Name <i class="bx" [ngClass]="getMasterSortIcon(\'name\')"></i></th>', html)
        html = re.sub(r'<th>Course</th>', r'<th class="sortable" (click)="sortMaster(\'course\')">Course <i class="bx" [ngClass]="getMasterSortIcon(\'course\')"></i></th>', html)


        # 2. Total Apps Table
        html = html.replace('[(ngModel)]="totalAppSearch"', '[(ngModel)]="totalAppSearch" (ngModelChange)="onTotalAppSearchChange()"')
        html = html.replace('[(ngModel)]="totalAppPageSize"', '[(ngModel)]="totalAppPageSize" (ngModelChange)="onTotalAppSizeChange()"')
        if '<button class="btn primary" (click)="exportExcel(\'total_applications\')"' not in html:
            html = html.replace(
                '<input type="text" placeholder="Search Applications" [(ngModel)]="totalAppSearch" (ngModelChange)="onTotalAppSearchChange()">',
                '<input type="text" placeholder="Search Applications" [(ngModel)]="totalAppSearch" (ngModelChange)="onTotalAppSearchChange()">\n                <button class="btn primary" (click)="exportExcel(\'total_applications\')" [disabled]="exporting[\'total_applications\']">\n                  <i class="bx" [ngClass]="exporting[\'total_applications\'] ? \'bx-loader-alt bx-spin\' : \'bx-export\'"></i>\n                  {{ exporting[\'total_applications\'] ? \'Exporting...\' : \'Export\' }}\n                </button>'
            )
        html = html.replace('filteredTotalApplications.length', 'totalAppTotal')
        html = html.replace('paginatedTotalApplications', 'paginatedTotalApplications()')
        html = re.sub(r'\(click\)="totalAppPage = 1"', r'(click)="totalAppPage = 1; fetchCourseStudents(\'total_applications\')"', html)
        html = re.sub(r'\(click\)="changePage\(\'totalApp\', -1\)"', r'(click)="changeTotalAppPage(-1)"', html)
        html = re.sub(r'\(click\)="changePage\(\'totalApp\', 1\)"', r'(click)="changeTotalAppPage(1)"', html)
        html = re.sub(r'\(click\)="totalAppPage = getTotalPages\(.*?\)"', r'(click)="totalAppPage = getTotalPages(totalAppTotal, totalAppPageSize); fetchCourseStudents(\'total_applications\')"', html)

        # 3. Cancelled Apps Table
        html = html.replace('[(ngModel)]="cancelledAppSearch"', '[(ngModel)]="cancelledAppSearch" (ngModelChange)="onCancelledAppSearchChange()"')
        html = html.replace('[(ngModel)]="cancelledAppPageSize"', '[(ngModel)]="cancelledAppPageSize" (ngModelChange)="onCancelledAppSizeChange()"')
        if '<button class="btn primary" (click)="exportExcel(\'cancelled_applications\')"' not in html:
            html = html.replace(
                '<input type="text" placeholder="Search Cancelled" [(ngModel)]="cancelledAppSearch" (ngModelChange)="onCancelledAppSearchChange()">',
                '<input type="text" placeholder="Search Cancelled" [(ngModel)]="cancelledAppSearch" (ngModelChange)="onCancelledAppSearchChange()">\n                <button class="btn primary" (click)="exportExcel(\'cancelled_applications\')" [disabled]="exporting[\'cancelled_applications\']">\n                  <i class="bx" [ngClass]="exporting[\'cancelled_applications\'] ? \'bx-loader-alt bx-spin\' : \'bx-export\'"></i>\n                  {{ exporting[\'cancelled_applications\'] ? \'Exporting...\' : \'Export\' }}\n                </button>'
            )
        html = html.replace('filteredCancelledApplications.length', 'cancelledAppTotal')
        html = html.replace('paginatedCancelledApplications', 'paginatedCancelledApplications()')
        html = re.sub(r'\(click\)="cancelledAppPage = 1"', r'(click)="cancelledAppPage = 1; fetchCourseStudents(\'cancelled_applications\')"', html)
        html = re.sub(r'\(click\)="changePage\(\'cancelledApp\', -1\)"', r'(click)="changeCancelledAppPage(-1)"', html)
        html = re.sub(r'\(click\)="changePage\(\'cancelledApp\', 1\)"', r'(click)="changeCancelledAppPage(1)"', html)
        html = re.sub(r'\(click\)="cancelledAppPage = getTotalPages\(.*?\)"', r'(click)="cancelledAppPage = getTotalPages(cancelledAppTotal, cancelledAppPageSize); fetchCourseStudents(\'cancelled_applications\')"', html)

        # 4. Total Admissions
        html = html.replace('[(ngModel)]="totalAdmSearch"', '[(ngModel)]="totalAdmSearch" (ngModelChange)="onTotalAdmSearchChange()"')
        html = html.replace('[(ngModel)]="totalAdmPageSize"', '[(ngModel)]="totalAdmPageSize" (ngModelChange)="onTotalAdmSizeChange()"')
        if '<button class="btn primary" (click)="exportExcel(\'confirmed_admissions\')"' not in html:
            html = html.replace(
                '<input type="text" placeholder="Search Admissions" [(ngModel)]="totalAdmSearch" (ngModelChange)="onTotalAdmSearchChange()">',
                '<input type="text" placeholder="Search Admissions" [(ngModel)]="totalAdmSearch" (ngModelChange)="onTotalAdmSearchChange()">\n                <button class="btn primary" (click)="exportExcel(\'confirmed_admissions\')" [disabled]="exporting[\'confirmed_admissions\']">\n                  <i class="bx" [ngClass]="exporting[\'confirmed_admissions\'] ? \'bx-loader-alt bx-spin\' : \'bx-export\'"></i>\n                  {{ exporting[\'confirmed_admissions\'] ? \'Exporting...\' : \'Export\' }}\n                </button>'
            )
        html = html.replace('filteredTotalAdmissions.length', 'totalAdmTotal')
        html = html.replace('paginatedTotalAdmissions', 'paginatedTotalAdmissions()')
        html = re.sub(r'\(click\)="totalAdmPage = 1"', r'(click)="totalAdmPage = 1; fetchCourseStudents(\'confirmed_admissions\')"', html)
        html = re.sub(r'\(click\)="changePage\(\'totalAdm\', -1\)"', r'(click)="changeTotalAdmPage(-1)"', html)
        html = re.sub(r'\(click\)="changePage\(\'totalAdm\', 1\)"', r'(click)="changeTotalAdmPage(1)"', html)
        html = re.sub(r'\(click\)="totalAdmPage = getTotalPages\(.*?\)"', r'(click)="totalAdmPage = getTotalPages(totalAdmTotal, totalAdmPageSize); fetchCourseStudents(\'confirmed_admissions\')"', html)

        # 5. Cancelled Admissions
        html = html.replace('[(ngModel)]="cancelledAdmSearch"', '[(ngModel)]="cancelledAdmSearch" (ngModelChange)="onCancelledAdmSearchChange()"')
        html = html.replace('[(ngModel)]="cancelledAdmPageSize"', '[(ngModel)]="cancelledAdmPageSize" (ngModelChange)="onCancelledAdmSizeChange()"')
        if '<button class="btn primary" (click)="exportExcel(\'cancelled_admissions\')"' not in html:
            html = html.replace(
                '<input type="text" placeholder="Search Cancelled Adms" [(ngModel)]="cancelledAdmSearch" (ngModelChange)="onCancelledAdmSearchChange()">',
                '<input type="text" placeholder="Search Cancelled Adms" [(ngModel)]="cancelledAdmSearch" (ngModelChange)="onCancelledAdmSearchChange()">\n                <button class="btn primary" (click)="exportExcel(\'cancelled_admissions\')" [disabled]="exporting[\'cancelled_admissions\']">\n                  <i class="bx" [ngClass]="exporting[\'cancelled_admissions\'] ? \'bx-loader-alt bx-spin\' : \'bx-export\'"></i>\n                  {{ exporting[\'cancelled_admissions\'] ? \'Exporting...\' : \'Export\' }}\n                </button>'
            )
        html = html.replace('filteredCancelledAdmissions.length', 'cancelledAdmTotal')
        html = html.replace('paginatedCancelledAdmissions', 'paginatedCancelledAdmissions()')
        html = re.sub(r'\(click\)="cancelledAdmPage = 1"', r'(click)="cancelledAdmPage = 1; fetchCourseStudents(\'cancelled_admissions\')"', html)
        html = re.sub(r'\(click\)="changePage\(\'cancelledAdm\', -1\)"', r'(click)="changeCancelledAdmPage(-1)"', html)
        html = re.sub(r'\(click\)="changePage\(\'cancelledAdm\', 1\)"', r'(click)="changeCancelledAdmPage(1)"', html)
        html = re.sub(r'\(click\)="cancelledAdmPage = getTotalPages\(.*?\)"', r'(click)="cancelledAdmPage = getTotalPages(cancelledAdmTotal, cancelledAdmPageSize); fetchCourseStudents(\'cancelled_admissions\')"', html)


        # 6. Consultancies
        html = html.replace('[(ngModel)]="consPageSize"', '[(ngModel)]="consPageSize" (ngModelChange)="onConsSizeChange()"')
        html = html.replace('filteredConsultancies.length', 'consTotal')
        html = html.replace('paginatedConsultancies', 'paginatedConsultancies()')
        html = re.sub(r'\(click\)="consPage = 1"', r'(click)="consPage = 1; fetchCourseConsultancies()"', html)
        html = re.sub(r'\(click\)="changePage\(\'cons\', -1\)"', r'(click)="changeConsPage(-1)"', html)
        html = re.sub(r'\(click\)="changePage\(\'cons\', 1\)"', r'(click)="changeConsPage(1)"', html)
        html = re.sub(r'\(click\)="consPage = getTotalPages\(.*?\)"', r'(click)="consPage = getTotalPages(consTotal, consPageSize); fetchCourseConsultancies()"', html)
        # Add search to consultancies if missing
        if 'consSearch' not in html:
            html = re.sub(r'(<h3 class="table-title">Consultancy Partners & Enrollment</h3>)', 
                          r'\1\n            <div class="search-box" style="margin-left: auto; width: 250px;">\n              <i class="bx bx-search"></i>\n              <input type="text" placeholder="Search Consultancy" [(ngModel)]="consSearch" (ngModelChange)="onConsSearchChange()">\n            </div>', html)

        # Consultancy Sorting Headers
        html = html.replace('<th>Consultancy Name</th>', '<th class="sortable" (click)="sortCons(\'name\')">Consultancy Name <i class="bx" [ngClass]="getConsSortIcon(\'name\')"></i></th>')
        html = html.replace('<th>Students Enrolled</th>', '<th class="sortable" (click)="sortCons(\'confirmedAdmissions\')">Students Enrolled <i class="bx" [ngClass]="getConsSortIcon(\'confirmedAdmissions\')"></i></th>')
        html = html.replace('<th>Commission Paid</th>', '<th>Commission Paid</th>')

        # 7. Institutions
        html = html.replace('[(ngModel)]="searchTerm"', '[(ngModel)]="instSearch" (ngModelChange)="onInstSearchChange()"')
        html = html.replace('[(ngModel)]="instPageSize"', '[(ngModel)]="instPageSize" (ngModelChange)="onInstSizeChange()"')
        html = html.replace('filteredInstitutions.length', 'instTotal')
        html = html.replace('paginatedInstitutions', 'paginatedInstitutions()')
        html = re.sub(r'\(click\)="instPage = 1"', r'(click)="instPage = 1; fetchCourseInstitutions()"', html)
        html = re.sub(r'\(click\)="changePage\(\'inst\', -1\)"', r'(click)="changeInstPage(-1)"', html)
        html = re.sub(r'\(click\)="changePage\(\'inst\', 1\)"', r'(click)="changeInstPage(1)"', html)
        html = re.sub(r'\(click\)="instPage = getTotalPages\(.*?\)"', r'(click)="instPage = getTotalPages(instTotal, instPageSize); fetchCourseInstitutions()"', html)

        # Institution Sorting Headers
        html = html.replace('<th>Institution Name</th>', '<th class="sortable" (click)="sortInst(\'name\')">Institution Name <i class="bx" [ngClass]="getInstSortIcon(\'name\')"></i></th>')
        html = html.replace('<th>Inst. Code</th>', '<th class="sortable" (click)="sortInst(\'code\')">Inst. Code <i class="bx" [ngClass]="getInstSortIcon(\'code\')"></i></th>')
        html = html.replace('<th>Students</th>', '<th class="sortable" (click)="sortInst(\'confirmedAdmissions\')">Students <i class="bx" [ngClass]="getInstSortIcon(\'confirmedAdmissions\')"></i></th>')


        with open('src/app/features/course-detail/course-detail.component.html', 'w', encoding='utf-8') as f:
            f.write(html)
        print("Success")
    except Exception as e:
        print(f"Error: {e}")
        
process()
