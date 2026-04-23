import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgApexchartsModule } from "ng-apexcharts";
import { InstitutionService } from '../../core/services/institution.service';
import { InstitutionDetail } from '../../core/models/institution.model';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { FormsModule } from '@angular/forms';
import { CourseService } from '../../core/services/course.service';
import { AdmissionService } from '../../core/services/admission.service';
import { ConsultancyService } from '../../core/services/consultancy.service';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-institution-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, NgApexchartsModule, SidebarComponent, TopbarComponent, FormsModule, ConfirmationModalComponent],
  templateUrl: './institution-detail.component.html',
  styleUrls: ['./institution-detail.component.scss']
})
export class InstitutionDetailComponent implements OnInit, OnDestroy {
  id: number | null = null;
  detail: InstitutionDetail | null = null;
  loading = true;
  private destroy$ = new Subject<void>();

  // Student Lists Signals
  totalApplications = signal<any[]>([]);
  totalAdmissionsSignal = signal<any[]>([]);
  cancelledApplications = signal<any[]>([]);
  cancelledAdmissions = signal<any[]>([]);
  masterList = signal<any[]>([]);

  // Search & Pagination States
  totalAppSearch = '';
  totalAppPage = 1;
  totalAppPageSize = 5;

  cancelledAppSearch = '';
  cancelledAppPage = 1;
  cancelledAppPageSize = 5;

  totalAdmSearch = '';
  totalAdmPage = 1;
  totalAdmPageSize = 5;

  cancelledAdmSearch = '';
  cancelledAdmPage = 1;
  cancelledAdmPageSize = 5;

  masterSearch = '';
  masterPage = 1;
  masterPageSize = 5;

  consSearch = '';
  consPage = 1;
  consPageSize = 5;

  coursesSearch = '';
  coursesPage = 1;
  coursesPageSize = 5;

  admissionsSearch = '';
  admissionsPage = 1;
  admissionsPageSize = 5;

  deletedSearch = '';
  deletedPage = 1;
  deletedPageSize = 5;

  // Filters
  admFilterSource: string | null = null;
  admFilterScholar: boolean | null = null;
  appFilterSource: string | null = null;
  appFilterScholar: boolean | null = null;
  consultancyStatusFilter: string | null = null;

  // Actions
  showDeleteModal = false;
  itemToDelete: any = null;
  deleteType: 'institution' | 'course' | 'admission' | 'consultancy' = 'institution';

  chartOptions: any = {
    series: [],
    chart: {
      type: 'bar',
      height: 400,
      toolbar: { show: false },
      sparkline: { enabled: false }
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: '30%',
        distributed: false,
      }
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: [],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: '#64748b', fontSize: '12px' }
      }
    },
    yaxis: { 
      labels: { 
        style: { colors: '#64748b', fontSize: '12px' }
      } 
    },
    grid: { 
      show: true,
      borderColor: '#f1f5f9',
      strokeDashArray: 2,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: "vertical",
        shadeIntensity: 0.1,
        gradientToColors: ['#818cf8'],
        inverseColors: true,
        opacityFrom: 0.9,
        opacityTo: 0.7,
        stops: [0, 90, 100]
      },
    },
    colors: ['#6366F1'],
    tooltip: { y: { formatter: (val: number) => `${val}` } }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private institutionService: InstitutionService,
    private courseService: CourseService,
    private admissionService: AdmissionService,
    private consultancyService: ConsultancyService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.id = +idParam;
        this.loadDetails(this.id);
      }
    });
  }

  loadDetails(id: number): void {
    this.loading = true;
    this.institutionService.getInstitutionDetail(id).subscribe({
      next: (data) => {
        this.detail = data;
        
        // Populate Signals for specialized lists
        this.totalApplications.set(data.totalApplications || []);
        this.totalAdmissionsSignal.set(data.totalAdmissions || []);
        this.cancelledApplications.set(data.cancelledApplications || []);
        this.cancelledAdmissions.set(data.cancelledAdmissions || []);

        // Combine for Master List
        const all = [
          ...(data.totalApplications || []),
          ...(data.totalAdmissions || []),
          ...(data.cancelledApplications || []),
          ...(data.cancelledAdmissions || [])
        ];
        this.masterList.set(all);

        this.prepareChartData(data.top5Consultancies || []);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading institution detail', err);
        this.loading = false;
      }
    });
  }

  prepareChartData(consultancies: any[]): void {
    if (!consultancies || consultancies.length === 0) {
      this.chartOptions.series = [];
      return;
    }
    this.chartOptions.series = [{
      name: 'Students',
      data: consultancies.map(t => t.value)
    }];
    this.chartOptions.xaxis.categories = consultancies.map(t => t.label);
  }

  // --- Filtering & Pagination Getters ---

  // Master List
  get filteredMasterList() {
    const search = this.masterSearch.toLowerCase();
    return this.masterList().filter(item => 
      item.studentName.toLowerCase().includes(search) || 
      item.courseName.toLowerCase().includes(search)
    );
  }
  get paginatedMasterList() {
    const start = (this.masterPage - 1) * this.masterPageSize;
    return this.filteredMasterList.slice(start, start + this.masterPageSize);
  }

  // Total Applications
  get filteredTotalApplications() {
    const search = this.totalAppSearch.toLowerCase();
    return this.totalApplications().filter(item => {
      const matchesSearch = item.studentName.toLowerCase().includes(search) || item.courseName.toLowerCase().includes(search);
      const matchesSource = !this.appFilterSource || item.source === this.appFilterSource;
      const matchesScholar = this.appFilterScholar === null || (item.isScholler === (this.appFilterScholar ? 'YES' : 'NO'));
      return matchesSearch && matchesSource && matchesScholar;
    });
  }
  get paginatedTotalApplications() {
    const start = (this.totalAppPage - 1) * this.totalAppPageSize;
    return this.filteredTotalApplications.slice(start, start + this.totalAppPageSize);
  }

  // Cancelled Applications
  get filteredCancelledApplications() {
    const search = this.cancelledAppSearch.toLowerCase();
    return this.cancelledApplications().filter(item => 
      item.studentName.toLowerCase().includes(search) || item.courseName.toLowerCase().includes(search)
    );
  }
  get paginatedCancelledApplications() {
    const start = (this.cancelledAppPage - 1) * this.cancelledAppPageSize;
    return this.filteredCancelledApplications.slice(start, start + this.cancelledAppPageSize);
  }

  // Total Admissions
  get filteredTotalAdmissions() {
    const search = this.totalAdmSearch.toLowerCase();
    return this.totalAdmissionsSignal().filter(item => {
      const matchesSearch = item.studentName.toLowerCase().includes(search) || item.courseName.toLowerCase().includes(search);
      const matchesSource = !this.admFilterSource || item.source === this.admFilterSource;
      const matchesScholar = this.admFilterScholar === null || (item.isScholler === (this.admFilterScholar ? 'YES' : 'NO'));
      return matchesSearch && matchesSource && matchesScholar;
    });
  }
  get paginatedTotalAdmissions() {
    const start = (this.totalAdmPage - 1) * this.totalAdmPageSize;
    return this.filteredTotalAdmissions.slice(start, start + this.totalAdmPageSize);
  }

  // Cancelled Admissions
  get filteredCancelledAdmList() {
    const search = this.cancelledAdmSearch.toLowerCase();
    return this.cancelledAdmissions().filter(item => 
      item.studentName.toLowerCase().includes(search) || item.courseName.toLowerCase().includes(search)
    );
  }
  get paginatedCancelledAdmissions() {
    const start = (this.cancelledAdmPage - 1) * this.cancelledAdmPageSize;
    return this.filteredCancelledAdmList.slice(start, start + this.cancelledAdmPageSize);
  }

  // Consultancies
  get filteredConsultancies() {
    const search = this.consSearch.toLowerCase();
    return (this.detail?.consultancies || []).filter(c => 
      c.name.toLowerCase().includes(search) &&
      (!this.consultancyStatusFilter || c.status === this.consultancyStatusFilter)
    );
  }
  get paginatedConsultancies() {
    const start = (this.consPage - 1) * this.consPageSize;
    return this.filteredConsultancies.slice(start, start + this.consPageSize);
  }

  // All Courses
  get filteredCourses() {
    const search = this.coursesSearch.toLowerCase();
    return (this.detail?.courses || []).filter(c => 
      c.name.toLowerCase().includes(search) || c.type.toLowerCase().includes(search)
    );
  }
  get paginatedCourses() {
    const start = (this.coursesPage - 1) * this.coursesPageSize;
    return this.filteredCourses.slice(start, start + this.coursesPageSize);
  }

  // All Admissions
  get filteredAdmissions() {
    const search = this.admissionsSearch.toLowerCase();
    return (this.detail?.admissions || []).filter(a => 
      a.studentName.toLowerCase().includes(search) || a.courseName.toLowerCase().includes(search)
    );
  }
  get paginatedAdmissions() {
    const start = (this.admissionsPage - 1) * this.admissionsPageSize;
    return this.filteredAdmissions.slice(start, start + this.admissionsPageSize);
  }

  // Softly Deleted Records
  get filteredSoftlyDeleted() {
    const search = this.deletedSearch.toLowerCase();
    return (this.detail?.softlyDeletedRecords || []).filter(r => 
      r.recordName.toLowerCase().includes(search) || r.type.toLowerCase().includes(search)
    );
  }
  get paginatedSoftlyDeleted() {
    const start = (this.deletedPage - 1) * this.deletedPageSize;
    return this.filteredSoftlyDeleted.slice(start, start + this.deletedPageSize);
  }

  // --- Interaction Handlers ---

  changePage(type: string, delta: number) {
    if (type === 'master') this.masterPage += delta;
    else if (type === 'totalApp') this.totalAppPage += delta;
    else if (type === 'cancelledApp') this.cancelledAppPage += delta;
    else if (type === 'totalAdm') this.totalAdmPage += delta;
    else if (type === 'cancelledAdm') this.cancelledAdmPage += delta;
    else if (type === 'cons') this.consPage += delta;
    else if (type === 'courses') this.coursesPage += delta;
    else if (type === 'admissions') this.admissionsPage += delta;
    else if (type === 'deleted') this.deletedPage += delta;
  }

  getTotalPages(count: number, size: number) {
    return Math.ceil(count / size) || 1;
  }

  scrollToTable(id: string) {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onStatClick(stat: string) {
    // Reset filters before navigation
    this.admFilterSource = null; this.admFilterScholar = null;
    this.appFilterSource = null; this.appFilterScholar = null;

    if (stat === 'total_all') this.scrollToTable('master-table');
    else if (stat === 'total_apps') this.scrollToTable('total-apps');
    else if (stat === 'can_apps') this.scrollToTable('cancelled-apps');
    else if (stat === 'total_adms') this.scrollToTable('total-adms');
    else if (stat === 'can_adms') this.scrollToTable('cancelled-adms');
    else if (stat === 'scholar_adm') { this.admFilterScholar = true; this.scrollToTable('total-adms'); }
    else if (stat === 'direct_adm') { this.admFilterSource = 'USER'; this.scrollToTable('total-adms'); }
    else if (stat === 'cons_adm') { this.admFilterSource = 'CONSULTANCY'; this.scrollToTable('total-adms'); }
    else if (stat === 'scholar_app') { this.appFilterScholar = true; this.scrollToTable('total-apps'); }
    else if (stat === 'direct_app') { this.appFilterSource = 'USER'; this.scrollToTable('total-apps'); }
    else if (stat === 'cons_app') { this.appFilterSource = 'CONSULTANCY'; this.scrollToTable('total-apps'); }
    else if (stat === 'total_cons') this.scrollToTable('consultancy-ownership');
  }

  clearApplicationFilter() { this.appFilterSource = null; this.appFilterScholar = null; this.totalAppPage = 1; }
  clearAdmissionFilter() { this.admFilterSource = null; this.admFilterScholar = null; this.totalAdmPage = 1; }
  clearConsultancyFilter() { this.consultancyStatusFilter = null; this.consPage = 1; }

  // --- CRUD Actions ---

  onEdit() { this.router.navigate(['/institution-management'], { fragment: 'edit', queryParams: { id: this.id } }); }
  onDelete() { this.itemToDelete = this.detail?.basicInfo; this.deleteType = 'institution'; this.showDeleteModal = true; }

  onViewCourse(id: number) { this.router.navigate(['/course-management', id]); }
  onEditCourse(id: number) { this.router.navigate(['/course-management'], { fragment: 'edit', queryParams: { id } }); }
  onDeleteCourse(course: any) { this.itemToDelete = course; this.deleteType = 'course'; this.showDeleteModal = true; }

  onViewAdmission(id: number) { this.router.navigate(['/admission-management', id]); }
  onEditAdmission(id: number) { this.router.navigate(['/admission-management'], { fragment: 'edit', queryParams: { id } }); }
  onDeleteAdmission(id: number) { this.itemToDelete = { id }; this.deleteType = 'admission'; this.showDeleteModal = true; }

  onViewConsultancy(id: number) { this.router.navigate(['/consultancy-management', id]); }
  onEditConsultancy(id: number) { this.router.navigate(['/consultancy-management'], { fragment: 'edit', queryParams: { id } }); }
  onDeleteConsultancy(consultancy: any) { this.itemToDelete = consultancy; this.deleteType = 'consultancy'; this.showDeleteModal = true; }

  onRestoreRecord(record: any) {
    if (!this.id) return;
    this.loading = true;
    this.institutionService.restoreRecord(record.id, record.type).subscribe({
      next: () => this.loadDetails(this.id!),
      error: (err) => { console.error('Error restoring record', err); this.loading = false; }
    });
  }

  onDeletePermanent(record: any) {
    if (!confirm(`Are you sure you want to permanently delete this ${record.type}? This action cannot be undone.`)) return;
    if (!this.id) return;
    this.loading = true;
    this.institutionService.deletePermanent(record.id, record.type).subscribe({
      next: () => this.loadDetails(this.id!),
      error: (err) => { console.error('Error permanent deleting record', err); this.loading = false; }
    });
  }

  cancelDelete() { this.itemToDelete = null; this.showDeleteModal = false; }
  confirmDelete() {
    const item = this.itemToDelete;
    const instId = this.id;
    if (!item || instId === null) return;

    this.loading = true;
    let deleteObservable;
    switch (this.deleteType) {
      case 'institution': deleteObservable = this.institutionService.deleteInstitution(instId); break;
      case 'course': deleteObservable = this.courseService.deleteCourse(item.id); break;
      case 'admission': deleteObservable = this.admissionService.deleteAdmission(item.id); break;
      case 'consultancy': deleteObservable = this.consultancyService.deleteConsultancy(item.id); break;
      default: this.loading = false; this.showDeleteModal = false; return;
    }

    deleteObservable.subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.itemToDelete = null;
        if (this.deleteType === 'institution') this.router.navigate(['/institution-management']);
        else this.loadDetails(instId);
      },
      error: (err: any) => { 
        console.error(`Error deleting ${this.deleteType}`, err); 
        this.loading = false; 
        this.showDeleteModal = false; 
      }
    });
  }

  goBack(): void { window.history.back(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
