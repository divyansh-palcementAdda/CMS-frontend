const fs = require('fs');

function fixHtml() {
    let html = fs.readFileSync('src/app/features/course-detail/course-detail.component.html', 'utf-8');
    
    // The node script added () to these getters which caused Angular errors
    html = html.replace(/paginatedMasterList\(\)/g, 'paginatedMasterList');
    html = html.replace(/paginatedTotalApplications\(\)/g, 'paginatedTotalApplications');
    html = html.replace(/paginatedCancelledApplications\(\)/g, 'paginatedCancelledApplications');
    html = html.replace(/paginatedTotalAdmissions\(\)/g, 'paginatedTotalAdmissions');
    html = html.replace(/paginatedCancelledAdmissions\(\)/g, 'paginatedCancelledAdmissions');
    html = html.replace(/paginatedConsultancies\(\)/g, 'paginatedConsultancies');
    html = html.replace(/paginatedInstitutions\(\)/g, 'paginatedInstitutions');
    
    fs.writeFileSync('src/app/features/course-detail/course-detail.component.html', html, 'utf-8');
    console.log("Fixed HTML getters");
}

fixHtml();
