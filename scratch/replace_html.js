const fs = require('fs');

function processHtml() {
    try {
        let html = fs.readFileSync('src/app/features/course-detail/course-detail.component.html', 'utf-8');

        // 1. Master Table
        html = html.replace(/\[\(ngModel\)\]="masterSearch"/g, '[(ngModel)]="masterSearch" (ngModelChange)="onMasterSearchChange()"');
        html = html.replace(/\[\(ngModel\)\]="masterPageSize"/g, '[(ngModel)]="masterPageSize" (ngModelChange)="onMasterSizeChange()"');
        if (!html.includes('<button class="btn primary" (click)="exportExcel(\'remaining_applications\')"')) {
            html = html.replace(
                '<input type="text" placeholder="Search Master List" [(ngModel)]="masterSearch" (ngModelChange)="onMasterSearchChange()">',
                '<input type="text" placeholder="Search Master List" [(ngModel)]="masterSearch" (ngModelChange)="onMasterSearchChange()">\n                <button class="btn primary" (click)="exportExcel(\'remaining_applications\')" [disabled]="exporting[\'remaining_applications\']">\n                  <i class="bx" [ngClass]="exporting[\'remaining_applications\'] ? \'bx-loader-alt bx-spin\' : \'bx-export\'"></i>\n                  {{ exporting[\'remaining_applications\'] ? \'Exporting...\' : \'Export\' }}\n                </button>'
            );
        }
        html = html.replace(/filteredMasterList\.length/g, 'masterTotal');
        html = html.replace(/paginatedMasterList/g, 'paginatedMasterList()');
        html = html.replace(/\(click\)="masterPage = 1"/g, '(click)="masterPage = 1; fetchCourseStudents(\'remaining_applications\')"');
        html = html.replace(/\(click\)="changePage\('master', -1\)"/g, '(click)="changeMasterPage(-1)"');
        html = html.replace(/\(click\)="changePage\('master', 1\)"/g, '(click)="changeMasterPage(1)"');
        html = html.replace(/\(click\)="masterPage = getTotalPages\(.*?\)"/g, '(click)="masterPage = getTotalPages(masterTotal, masterPageSize); fetchCourseStudents(\'remaining_applications\')"');

        html = html.replace(/<th>Date of App<\/th>/g, '<th class="sortable" (click)="sortMaster(\'date\')">Date of App <i class="bx" [ngClass]="getMasterSortIcon(\'date\')"></i></th>');
        html = html.replace(/<th>Student Name<\/th>/g, '<th class="sortable" (click)="sortMaster(\'name\')">Student Name <i class="bx" [ngClass]="getMasterSortIcon(\'name\')"></i></th>');
        html = html.replace(/<th>Course<\/th>/g, '<th class="sortable" (click)="sortMaster(\'course\')">Course <i class="bx" [ngClass]="getMasterSortIcon(\'course\')"></i></th>');

        // 2. Total Apps Table
        html = html.replace(/\[\(ngModel\)\]="totalAppSearch"/g, '[(ngModel)]="totalAppSearch" (ngModelChange)="onTotalAppSearchChange()"');
        html = html.replace(/\[\(ngModel\)\]="totalAppPageSize"/g, '[(ngModel)]="totalAppPageSize" (ngModelChange)="onTotalAppSizeChange()"');
        if (!html.includes('<button class="btn primary" (click)="exportExcel(\'total_applications\')"')) {
            html = html.replace(
                '<input type="text" placeholder="Search Applications" [(ngModel)]="totalAppSearch" (ngModelChange)="onTotalAppSearchChange()">',
                '<input type="text" placeholder="Search Applications" [(ngModel)]="totalAppSearch" (ngModelChange)="onTotalAppSearchChange()">\n                <button class="btn primary" (click)="exportExcel(\'total_applications\')" [disabled]="exporting[\'total_applications\']">\n                  <i class="bx" [ngClass]="exporting[\'total_applications\'] ? \'bx-loader-alt bx-spin\' : \'bx-export\'"></i>\n                  {{ exporting[\'total_applications\'] ? \'Exporting...\' : \'Export\' }}\n                </button>'
            );
        }
        html = html.replace(/filteredTotalApplications\.length/g, 'totalAppTotal');
        html = html.replace(/paginatedTotalApplications/g, 'paginatedTotalApplications()');
        html = html.replace(/\(click\)="totalAppPage = 1"/g, '(click)="totalAppPage = 1; fetchCourseStudents(\'total_applications\')"');
        html = html.replace(/\(click\)="changePage\('totalApp', -1\)"/g, '(click)="changeTotalAppPage(-1)"');
        html = html.replace(/\(click\)="changePage\('totalApp', 1\)"/g, '(click)="changeTotalAppPage(1)"');
        html = html.replace(/\(click\)="totalAppPage = getTotalPages\(.*?\)"/g, '(click)="totalAppPage = getTotalPages(totalAppTotal, totalAppPageSize); fetchCourseStudents(\'total_applications\')"');

        // 3. Cancelled Apps Table
        html = html.replace(/\[\(ngModel\)\]="cancelledAppSearch"/g, '[(ngModel)]="cancelledAppSearch" (ngModelChange)="onCancelledAppSearchChange()"');
        html = html.replace(/\[\(ngModel\)\]="cancelledAppPageSize"/g, '[(ngModel)]="cancelledAppPageSize" (ngModelChange)="onCancelledAppSizeChange()"');
        if (!html.includes('<button class="btn primary" (click)="exportExcel(\'cancelled_applications\')"')) {
            html = html.replace(
                '<input type="text" placeholder="Search Cancelled" [(ngModel)]="cancelledAppSearch" (ngModelChange)="onCancelledAppSearchChange()">',
                '<input type="text" placeholder="Search Cancelled" [(ngModel)]="cancelledAppSearch" (ngModelChange)="onCancelledAppSearchChange()">\n                <button class="btn primary" (click)="exportExcel(\'cancelled_applications\')" [disabled]="exporting[\'cancelled_applications\']">\n                  <i class="bx" [ngClass]="exporting[\'cancelled_applications\'] ? \'bx-loader-alt bx-spin\' : \'bx-export\'"></i>\n                  {{ exporting[\'cancelled_applications\'] ? \'Exporting...\' : \'Export\' }}\n                </button>'
            );
        }
        html = html.replace(/filteredCancelledApplications\.length/g, 'cancelledAppTotal');
        html = html.replace(/paginatedCancelledApplications/g, 'paginatedCancelledApplications()');
        html = html.replace(/\(click\)="cancelledAppPage = 1"/g, '(click)="cancelledAppPage = 1; fetchCourseStudents(\'cancelled_applications\')"');
        html = html.replace(/\(click\)="changePage\('cancelledApp', -1\)"/g, '(click)="changeCancelledAppPage(-1)"');
        html = html.replace(/\(click\)="changePage\('cancelledApp', 1\)"/g, '(click)="changeCancelledAppPage(1)"');
        html = html.replace(/\(click\)="cancelledAppPage = getTotalPages\(.*?\)"/g, '(click)="cancelledAppPage = getTotalPages(cancelledAppTotal, cancelledAppPageSize); fetchCourseStudents(\'cancelled_applications\')"');

        // 4. Total Admissions
        html = html.replace(/\[\(ngModel\)\]="totalAdmSearch"/g, '[(ngModel)]="totalAdmSearch" (ngModelChange)="onTotalAdmSearchChange()"');
        html = html.replace(/\[\(ngModel\)\]="totalAdmPageSize"/g, '[(ngModel)]="totalAdmPageSize" (ngModelChange)="onTotalAdmSizeChange()"');
        if (!html.includes('<button class="btn primary" (click)="exportExcel(\'confirmed_admissions\')"')) {
            html = html.replace(
                '<input type="text" placeholder="Search Admissions" [(ngModel)]="totalAdmSearch" (ngModelChange)="onTotalAdmSearchChange()">',
                '<input type="text" placeholder="Search Admissions" [(ngModel)]="totalAdmSearch" (ngModelChange)="onTotalAdmSearchChange()">\n                <button class="btn primary" (click)="exportExcel(\'confirmed_admissions\')" [disabled]="exporting[\'confirmed_admissions\']">\n                  <i class="bx" [ngClass]="exporting[\'confirmed_admissions\'] ? \'bx-loader-alt bx-spin\' : \'bx-export\'"></i>\n                  {{ exporting[\'confirmed_admissions\'] ? \'Exporting...\' : \'Export\' }}\n                </button>'
            );
        }
        html = html.replace(/filteredTotalAdmissions\.length/g, 'totalAdmTotal');
        html = html.replace(/paginatedTotalAdmissions/g, 'paginatedTotalAdmissions()');
        html = html.replace(/\(click\)="totalAdmPage = 1"/g, '(click)="totalAdmPage = 1; fetchCourseStudents(\'confirmed_admissions\')"');
        html = html.replace(/\(click\)="changePage\('totalAdm', -1\)"/g, '(click)="changeTotalAdmPage(-1)"');
        html = html.replace(/\(click\)="changePage\('totalAdm', 1\)"/g, '(click)="changeTotalAdmPage(1)"');
        html = html.replace(/\(click\)="totalAdmPage = getTotalPages\(.*?\)"/g, '(click)="totalAdmPage = getTotalPages(totalAdmTotal, totalAdmPageSize); fetchCourseStudents(\'confirmed_admissions\')"');

        // 5. Cancelled Admissions
        html = html.replace(/\[\(ngModel\)\]="cancelledAdmSearch"/g, '[(ngModel)]="cancelledAdmSearch" (ngModelChange)="onCancelledAdmSearchChange()"');
        html = html.replace(/\[\(ngModel\)\]="cancelledAdmPageSize"/g, '[(ngModel)]="cancelledAdmPageSize" (ngModelChange)="onCancelledAdmSizeChange()"');
        if (!html.includes('<button class="btn primary" (click)="exportExcel(\'cancelled_admissions\')"')) {
            html = html.replace(
                '<input type="text" placeholder="Search Cancelled Adms" [(ngModel)]="cancelledAdmSearch" (ngModelChange)="onCancelledAdmSearchChange()">',
                '<input type="text" placeholder="Search Cancelled Adms" [(ngModel)]="cancelledAdmSearch" (ngModelChange)="onCancelledAdmSearchChange()">\n                <button class="btn primary" (click)="exportExcel(\'cancelled_admissions\')" [disabled]="exporting[\'cancelled_admissions\']">\n                  <i class="bx" [ngClass]="exporting[\'cancelled_admissions\'] ? \'bx-loader-alt bx-spin\' : \'bx-export\'"></i>\n                  {{ exporting[\'cancelled_admissions\'] ? \'Exporting...\' : \'Export\' }}\n                </button>'
            );
        }
        html = html.replace(/filteredCancelledAdmissions\.length/g, 'cancelledAdmTotal');
        html = html.replace(/paginatedCancelledAdmissions/g, 'paginatedCancelledAdmissions()');
        html = html.replace(/\(click\)="cancelledAdmPage = 1"/g, '(click)="cancelledAdmPage = 1; fetchCourseStudents(\'cancelled_admissions\')"');
        html = html.replace(/\(click\)="changePage\('cancelledAdm', -1\)"/g, '(click)="changeCancelledAdmPage(-1)"');
        html = html.replace(/\(click\)="changePage\('cancelledAdm', 1\)"/g, '(click)="changeCancelledAdmPage(1)"');
        html = html.replace(/\(click\)="cancelledAdmPage = getTotalPages\(.*?\)"/g, '(click)="cancelledAdmPage = getTotalPages(cancelledAdmTotal, cancelledAdmPageSize); fetchCourseStudents(\'cancelled_admissions\')"');

        // 6. Consultancies
        html = html.replace(/\[\(ngModel\)\]="consPageSize"/g, '[(ngModel)]="consPageSize" (ngModelChange)="onConsSizeChange()"');
        html = html.replace(/filteredConsultancies\.length/g, 'consTotal');
        html = html.replace(/paginatedConsultancies/g, 'paginatedConsultancies()');
        html = html.replace(/\(click\)="consPage = 1"/g, '(click)="consPage = 1; fetchCourseConsultancies()"');
        html = html.replace(/\(click\)="changePage\('cons', -1\)"/g, '(click)="changeConsPage(-1)"');
        html = html.replace(/\(click\)="changePage\('cons', 1\)"/g, '(click)="changeConsPage(1)"');
        html = html.replace(/\(click\)="consPage = getTotalPages\(.*?\)"/g, '(click)="consPage = getTotalPages(consTotal, consPageSize); fetchCourseConsultancies()"');
        
        if (!html.includes('consSearch')) {
            html = html.replace(
                /<h3 class="table-title">Consultancy Partners & Enrollment<\/h3>/g, 
                '<h3 class="table-title">Consultancy Partners & Enrollment</h3>\n            <div class="search-box" style="margin-left: auto; width: 250px;">\n              <i class="bx bx-search"></i>\n              <input type="text" placeholder="Search Consultancy" [(ngModel)]="consSearch" (ngModelChange)="onConsSearchChange()">\n            </div>'
            );
        }

        html = html.replace(/<th>Consultancy Name<\/th>/g, '<th class="sortable" (click)="sortCons(\'name\')">Consultancy Name <i class="bx" [ngClass]="getConsSortIcon(\'name\')"></i></th>');
        html = html.replace(/<th>Students Enrolled<\/th>/g, '<th class="sortable" (click)="sortCons(\'confirmedAdmissions\')">Students Enrolled <i class="bx" [ngClass]="getConsSortIcon(\'confirmedAdmissions\')"></i></th>');
        html = html.replace(/<th>Total Applications<\/th>/g, '<th class="sortable" (click)="sortCons(\'totalApplications\')">Total Applications <i class="bx" [ngClass]="getConsSortIcon(\'totalApplications\')"></i></th>');
        html = html.replace(/<th>Confirmed Admissions<\/th>/g, '<th class="sortable" (click)="sortCons(\'confirmedAdmissions\')">Confirmed Admissions <i class="bx" [ngClass]="getConsSortIcon(\'confirmedAdmissions\')"></i></th>');
        html = html.replace(/<th>Remaining Applications<\/th>/g, '<th class="sortable" (click)="sortCons(\'remainingApplications\')">Remaining Applications <i class="bx" [ngClass]="getConsSortIcon(\'remainingApplications\')"></i></th>');
        html = html.replace(/<th>Cancelled Applications<\/th>/g, '<th class="sortable" (click)="sortCons(\'cancelledApplications\')">Cancelled Applications <i class="bx" [ngClass]="getConsSortIcon(\'cancelledApplications\')"></i></th>');
        html = html.replace(/<th>Cancelled Admissions<\/th>/g, '<th class="sortable" (click)="sortCons(\'cancelledAdmissions\')">Cancelled Admissions <i class="bx" [ngClass]="getConsSortIcon(\'cancelledAdmissions\')"></i></th>');

        // 7. Institutions
        html = html.replace(/\[\(ngModel\)\]="searchTerm"/g, '[(ngModel)]="instSearch" (ngModelChange)="onInstSearchChange()"');
        html = html.replace(/\[\(ngModel\)\]="instPageSize"/g, '[(ngModel)]="instPageSize" (ngModelChange)="onInstSizeChange()"');
        html = html.replace(/filteredInstitutions\.length/g, 'instTotal');
        html = html.replace(/paginatedInstitutions/g, 'paginatedInstitutions()');
        html = html.replace(/\(click\)="instPage = 1"/g, '(click)="instPage = 1; fetchCourseInstitutions()"');
        html = html.replace(/\(click\)="changePage\('inst', -1\)"/g, '(click)="changeInstPage(-1)"');
        html = html.replace(/\(click\)="changePage\('inst', 1\)"/g, '(click)="changeInstPage(1)"');
        html = html.replace(/\(click\)="instPage = getTotalPages\(.*?\)"/g, '(click)="instPage = getTotalPages(instTotal, instPageSize); fetchCourseInstitutions()"');

        html = html.replace(/<th>Institution Name<\/th>/g, '<th class="sortable" (click)="sortInst(\'name\')">Institution Name <i class="bx" [ngClass]="getInstSortIcon(\'name\')"></i></th>');
        html = html.replace(/<th>Inst\. Code<\/th>/g, '<th class="sortable" (click)="sortInst(\'code\')">Inst. Code <i class="bx" [ngClass]="getInstSortIcon(\'code\')"></i></th>');
        html = html.replace(/<th>Students<\/th>/g, '<th class="sortable" (click)="sortInst(\'confirmedAdmissions\')">Students <i class="bx" [ngClass]="getInstSortIcon(\'confirmedAdmissions\')"></i></th>');

        fs.writeFileSync('src/app/features/course-detail/course-detail.component.html', html, 'utf-8');
        console.log("Success");
    } catch (e) {
        console.error("Error:", e);
    }
}

processHtml();
