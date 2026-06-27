import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../../shared/components/topbar/topbar.component';
import { DownloadConfirmationModalComponent } from '../../../shared/components/download-confirmation-modal/download-confirmation-modal.component';
import { StudentAnalyticsModalComponent } from '../../../shared/components/student-analytics-modal/student-analytics-modal.component';

import { LocationAnalyticsService } from '../../../core/services/location-analytics.service';
import {
  StateDetailDTO,
  UserBreakdown,
  ConsultancyBreakdown,
  InstitutionBreakdown,
  CourseBreakdown,
  CourseTypeBreakdown,
  LeadSourceBreakdown,
  CityBreakdown
} from '../../../core/models/location-analytics.model';

@Component({
  selector: 'app-state-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SidebarComponent,
    TopbarComponent,
    StudentAnalyticsModalComponent
  ],
  templateUrl: './state-detail.component.html',
  styleUrls: ['./state-detail.component.scss']
})
export class StateDetailComponent implements OnInit, OnDestroy {

  stateName!: string;
  stateDetail: StateDetailDTO | null = null;
  loading = true;
  private destroy$ = new Subject<void>();

  // --- Student List ---
  totalApplications = signal<any[]>([]);
  cancelledApplications = signal<any[]>([]);
  totalAdmissions = signal<any[]>([]);
  cancelledAdmissions = signal<any[]>([]);

  totalAppPage = 1; totalAppPageSize = 10; totalAppTotal = 0; totalAppSearch = ''; totalAppSortBy = 'date'; totalAppSortDir = 'desc';
  cancelledAppPage = 1; cancelledAppPageSize = 10; cancelledAppTotal = 0; cancelledAppSearch = ''; cancelledAppSortBy = 'date'; cancelledAppSortDir = 'desc';
  totalAdmPage = 1; totalAdmPageSize = 10; totalAdmTotal = 0; totalAdmSearch = ''; totalAdmSortBy = 'date'; totalAdmSortDir = 'desc';
  cancelledAdmPage = 1; cancelledAdmPageSize = 10; cancelledAdmTotal = 0; cancelledAdmSearch = ''; cancelledAdmSortBy = 'date'; cancelledAdmSortDir = 'desc';
  appFilterSource: string | null = null; appFilterScholar: boolean | null = null;
  admFilterSource: string | null = null; admFilterScholar: boolean | null = null;

  // --- Additional Filters ---
  appFilterDuplicate: boolean | null = null;
  appFilterFoc: boolean | null = null;
  appFilterSbs: boolean | null = null;
  admFilterDuplicate: boolean | null = null;
  admFilterFoc: boolean | null = null;
  admFilterSbs: boolean | null = null;
  currentAppTab: string = 'remaining_applications';
  currentAdmTab: string = 'confirmed_admissions';

  // --- User Breakdown ---
  userBreakdownList = signal<UserBreakdown[]>([]);
  userPage = 1; userPageSize = 10; userTotal = 0; userSortBy = 'userName'; userSortDir = 'asc';

  // --- Consultancy Breakdown ---
  consultancyList = signal<ConsultancyBreakdown[]>([]);
  consPage = 1; consPageSize = 10; consTotal = 0; consSortBy = 'consultancyName'; consSortDir = 'asc';

  // --- Institution Breakdown ---
  institutionList = signal<InstitutionBreakdown[]>([]);
  instPage = 1; instPageSize = 10; instTotal = 0; instSortBy = 'institutionName'; instSortDir = 'asc';

  // --- Course Breakdown ---
  courseList = signal<CourseBreakdown[]>([]);
  coursePage = 1; coursePageSize = 10; courseTotal = 0; courseSortBy = 'courseName'; courseSortDir = 'asc';

  // --- City Breakdown (unique to state-detail) ---
  cityBreakdownList = signal<CityBreakdown[]>([]);
  cityPage = 1; cityPageSize = 10; cityTotal = 0; citySortBy = 'cityName'; citySortDir = 'asc';

  // --- Course Type Breakdown ---
  courseTypeList: CourseTypeBreakdown[] = [];

  // --- Lead Source Breakdown ---
  leadSourceList: LeadSourceBreakdown[] = [];

  // --- Analytics Modal ---
  showAnalyticsModal = false;
  modalUserId = 0;
  modalUserName = '';
  modalInitialTab = 'ALL_APPLICATIONS';
  modalCity = '';
  modalState = this.stateName || '';

  // --- Export ---
  exporting: { [key: string]: boolean } = {};

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private locationAnalyticsService: LocationAnalyticsService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('stateId');
      if (id) {
        this.stateName = decodeURIComponent(id);
        this.loadAll();
      }
    });

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['showAnalyticsModal'] === 'true') {
        this.modalUserId = Number(params['modalUserId'] || 0);
        this.modalUserName = params['modalUserName'] || '';
        this.modalInitialTab = params['modalInitialTab'] || 'ALL_APPLICATIONS';
        this.showAnalyticsModal = true;
      } else {
        this.showAnalyticsModal = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAll(): void {
    this.loading = true;
    this.locationAnalyticsService.getStateDetail(this.stateName).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.stateDetail = data;
        this.loading = false;
        this.loadStudents('remaining_applications');
        this.loadStudents('cancelled_applications');
        this.loadStudents('confirmed_admissions');
        this.loadStudents('cancelled_admissions');
        this.loadUserBreakdown();
        this.loadConsultancyBreakdown();
        this.loadInstitutionBreakdown();
        this.loadCourseBreakdown();
        this.loadCityBreakdown();
        this.loadCourseTypeBreakdown();
        this.loadLeadSourceBreakdown();
      },
      error: (err) => {
        console.error('Error loading state detail:', err);
        this.loading = false;
      }
    });
  }

  loadStudents(tab: string): void {
    let page: number, size: number, search: string, source: string | null, scholar: boolean | null, sortBy: string, sortDir: string;
    let duplicateOnly: boolean | null = null;
    let showOnlyFoc: boolean | null = null;
    let showOnlySbs: boolean | null = null;

    if (tab === 'remaining_applications' || tab === 'total_applications') {
      page = this.totalAppPage - 1;
      size = this.totalAppPageSize;
      search = this.totalAppSearch;
      source = this.appFilterSource;
      scholar = this.appFilterScholar;
      sortBy = this.totalAppSortBy;
      sortDir = this.totalAppSortDir;
      duplicateOnly = this.appFilterDuplicate;
      showOnlyFoc = this.appFilterFoc;
      showOnlySbs = this.appFilterSbs;
      tab = this.currentAppTab;
    } else if (tab === 'cancelled_applications') {
      page = this.cancelledAppPage - 1; size = this.cancelledAppPageSize; search = this.cancelledAppSearch; source = null; scholar = null; sortBy = this.cancelledAppSortBy; sortDir = this.cancelledAppSortDir;
    } else if (tab === 'confirmed_admissions') {
      page = this.totalAdmPage - 1;
      size = this.totalAdmPageSize;
      search = this.totalAdmSearch;
      source = this.admFilterSource;
      scholar = this.admFilterScholar;
      sortBy = this.totalAdmSortBy;
      sortDir = this.totalAdmSortDir;
      duplicateOnly = this.admFilterDuplicate;
      showOnlyFoc = this.admFilterFoc;
      showOnlySbs = this.admFilterSbs;
      tab = this.currentAdmTab;
    } else if (tab === 'cancelled_admissions') {
      page = this.cancelledAdmPage - 1; size = this.cancelledAdmPageSize; search = this.cancelledAdmSearch; source = null; scholar = null; sortBy = this.cancelledAdmSortBy; sortDir = this.cancelledAdmSortDir;
    } else {
      return;
    }

    this.locationAnalyticsService.getStateStudentsPaged(
      this.stateName, page, size, tab, search, source || '', scholar, sortBy, sortDir, duplicateOnly, showOnlyFoc, showOnlySbs
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        const content = res.content || [];
        const total = res.totalElements || 0;
        if (tab === 'remaining_applications' || tab === 'total_applications') {
          this.totalApplications.set(content);
          this.totalAppTotal = total;
        } else if (tab === 'cancelled_applications') {
          this.cancelledApplications.set(content);
          this.cancelledAppTotal = total;
        } else if (tab === 'confirmed_admissions') {
          this.totalAdmissions.set(content);
          this.totalAdmTotal = total;
        } else if (tab === 'cancelled_admissions') {
          this.cancelledAdmissions.set(content);
          this.cancelledAdmTotal = total;
        }
      },
      error: err => console.error(`Error loading state students (${tab}):`, err)
    });
  }

  // ---- User Breakdown ----
  loadUserBreakdown(): void {
    this.locationAnalyticsService.getStateUserBreakdown(this.stateName, this.userPage - 1, this.userPageSize, this.userSortBy, this.userSortDir)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (res) => { this.userBreakdownList.set(res.content || []); this.userTotal = res.totalElements || 0; },
        error: err => console.error('Error loading state user breakdown:', err)
      });
  }

  // ---- Consultancy Breakdown ----
  loadConsultancyBreakdown(): void {
    this.locationAnalyticsService.getStateConsultancyBreakdown(this.stateName, this.consPage - 1, this.consPageSize, this.consSortBy, this.consSortDir)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (res) => { this.consultancyList.set(res.content || []); this.consTotal = res.totalElements || 0; },
        error: err => console.error('Error loading state consultancy breakdown:', err)
      });
  }

  // ---- Institution Breakdown ----
  loadInstitutionBreakdown(): void {
    this.locationAnalyticsService.getStateInstitutionBreakdown(this.stateName, this.instPage - 1, this.instPageSize, this.instSortBy, this.instSortDir)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (res) => { this.institutionList.set(res.content || []); this.instTotal = res.totalElements || 0; },
        error: err => console.error('Error loading state institution breakdown:', err)
      });
  }

  // ---- Course Breakdown ----
  loadCourseBreakdown(): void {
    this.locationAnalyticsService.getStateCourseBreakdown(this.stateName, this.coursePage - 1, this.coursePageSize, this.courseSortBy, this.courseSortDir)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (res) => { this.courseList.set(res.content || []); this.courseTotal = res.totalElements || 0; },
        error: err => console.error('Error loading state course breakdown:', err)
      });
  }

  // ---- City Breakdown ----
  loadCityBreakdown(): void {
    this.locationAnalyticsService.getStateCityBreakdown(this.stateName, this.cityPage - 1, this.cityPageSize, this.citySortBy, this.citySortDir)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (res) => { this.cityBreakdownList.set(res.content || []); this.cityTotal = res.totalElements || 0; },
        error: err => console.error('Error loading state city breakdown:', err)
      });
  }

  // ---- Course Type Breakdown ----
  loadCourseTypeBreakdown(): void {
    this.locationAnalyticsService.getStateCourseTypeBreakdown(this.stateName)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (res) => { this.courseTypeList = res || []; },
        error: err => console.error('Error loading state course type breakdown:', err)
      });
  }

  // ---- Lead Source Breakdown ----
  loadLeadSourceBreakdown(): void {
    this.locationAnalyticsService.getStateLeadSourceBreakdown(this.stateName)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (res) => { this.leadSourceList = res || []; },
        error: err => console.error('Error loading state lead source breakdown:', err)
      });
  }

  // ---- Sorting ----
  sortStudents(tab: string, col: string): void {
    switch (tab) {
      case 'remaining_applications': this.totalAppSortDir = this.totalAppSortBy === col ? (this.totalAppSortDir === 'asc' ? 'desc' : 'asc') : 'asc'; this.totalAppSortBy = col; this.totalAppPage = 1; break;
      case 'cancelled_applications': this.cancelledAppSortDir = this.cancelledAppSortBy === col ? (this.cancelledAppSortDir === 'asc' ? 'desc' : 'asc') : 'asc'; this.cancelledAppSortBy = col; this.cancelledAppPage = 1; break;
      case 'confirmed_admissions': this.totalAdmSortDir = this.totalAdmSortBy === col ? (this.totalAdmSortDir === 'asc' ? 'desc' : 'asc') : 'asc'; this.totalAdmSortBy = col; this.totalAdmPage = 1; break;
      case 'cancelled_admissions': this.cancelledAdmSortDir = this.cancelledAdmSortBy === col ? (this.cancelledAdmSortDir === 'asc' ? 'desc' : 'asc') : 'asc'; this.cancelledAdmSortBy = col; this.cancelledAdmPage = 1; break;
    }
    this.loadStudents(tab);
  }

  sortUsers(col: string): void { this.userSortDir = this.userSortBy === col ? (this.userSortDir === 'asc' ? 'desc' : 'asc') : 'asc'; this.userSortBy = col; this.userPage = 1; this.loadUserBreakdown(); }
  sortCons(col: string): void { this.consSortDir = this.consSortBy === col ? (this.consSortDir === 'asc' ? 'desc' : 'asc') : 'asc'; this.consSortBy = col; this.consPage = 1; this.loadConsultancyBreakdown(); }
  sortInst(col: string): void { this.instSortDir = this.instSortBy === col ? (this.instSortDir === 'asc' ? 'desc' : 'asc') : 'asc'; this.instSortBy = col; this.instPage = 1; this.loadInstitutionBreakdown(); }
  sortCourse(col: string): void { this.courseSortDir = this.courseSortBy === col ? (this.courseSortDir === 'asc' ? 'desc' : 'asc') : 'asc'; this.courseSortBy = col; this.coursePage = 1; this.loadCourseBreakdown(); }
  sortCity(col: string): void { this.citySortDir = this.citySortBy === col ? (this.citySortDir === 'asc' ? 'desc' : 'asc') : 'asc'; this.citySortBy = col; this.cityPage = 1; this.loadCityBreakdown(); }

  getSortIcon(sortBy: string, col: string, sortDir: string): string {
    return sortBy === col ? (sortDir === 'asc' ? 'bx-chevron-up' : 'bx-chevron-down') : 'bx-sort';
  }

  // ---- Pagination ----
  getTotalPages(total: number, size: number): number { return Math.max(1, Math.ceil(total / size)); }

  changeTotalAppPage(d: number): void { this.totalAppPage += d; this.loadStudents('remaining_applications'); }
  changeCancelledAppPage(d: number): void { this.cancelledAppPage += d; this.loadStudents('cancelled_applications'); }
  changeTotalAdmPage(d: number): void { this.totalAdmPage += d; this.loadStudents('confirmed_admissions'); }
  changeCancelledAdmPage(d: number): void { this.cancelledAdmPage += d; this.loadStudents('cancelled_admissions'); }
  changeUserPage(d: number): void { this.userPage += d; this.loadUserBreakdown(); }
  changeConsPage(d: number): void { this.consPage += d; this.loadConsultancyBreakdown(); }
  changeInstPage(d: number): void { this.instPage += d; this.loadInstitutionBreakdown(); }
  changeCoursePage(d: number): void { this.coursePage += d; this.loadCourseBreakdown(); }
  changeCityPage(d: number): void { this.cityPage += d; this.loadCityBreakdown(); }

  onTotalAppSizeChange(): void { this.totalAppPage = 1; this.loadStudents('remaining_applications'); }
  onCancelledAppSizeChange(): void { this.cancelledAppPage = 1; this.loadStudents('cancelled_applications'); }
  onTotalAdmSizeChange(): void { this.totalAdmPage = 1; this.loadStudents('confirmed_admissions'); }
  onCancelledAdmSizeChange(): void { this.cancelledAdmPage = 1; this.loadStudents('cancelled_admissions'); }

  onTotalAppSearchChange(): void { this.totalAppPage = 1; this.loadStudents('remaining_applications'); }
  onCancelledAppSearchChange(): void { this.cancelledAppPage = 1; this.loadStudents('cancelled_applications'); }
  onTotalAdmSearchChange(): void { this.totalAdmPage = 1; this.loadStudents('confirmed_admissions'); }
  onCancelledAdmSearchChange(): void { this.cancelledAdmPage = 1; this.loadStudents('cancelled_admissions'); }

  onUserSizeChange(): void { this.userPage = 1; this.loadUserBreakdown(); }
  onConsSizeChange(): void { this.consPage = 1; this.loadConsultancyBreakdown(); }
  onInstSizeChange(): void { this.instPage = 1; this.loadInstitutionBreakdown(); }
  onCourseSizeChange(): void { this.coursePage = 1; this.loadCourseBreakdown(); }
  onCitySizeChange(): void { this.cityPage = 1; this.loadCityBreakdown(); }

  // ---- Filters ----
  clearAppFilter(): void {
    this.appFilterSource = null;
    this.appFilterScholar = null;
    this.appFilterDuplicate = null;
    this.appFilterFoc = null;
    this.appFilterSbs = null;
    this.currentAppTab = 'remaining_applications';
    this.totalAppPage = 1;
    this.loadStudents('remaining_applications');
  }

  clearAdmFilter(): void {
    this.admFilterSource = null;
    this.admFilterScholar = null;
    this.admFilterDuplicate = null;
    this.admFilterFoc = null;
    this.admFilterSbs = null;
    this.currentAdmTab = 'confirmed_admissions';
    this.totalAdmPage = 1;
    this.loadStudents('confirmed_admissions');
  }

  onStatClick(stat: string): void {
    this.appFilterSource = null;
    this.appFilterScholar = null;
    this.appFilterDuplicate = null;
    this.appFilterFoc = null;
    this.appFilterSbs = null;
    this.currentAppTab = 'remaining_applications';

    this.admFilterSource = null;
    this.admFilterScholar = null;
    this.admFilterDuplicate = null;
    this.admFilterFoc = null;
    this.admFilterSbs = null;
    this.currentAdmTab = 'confirmed_admissions';

    if (stat === 'total_applications') {
      this.currentAppTab = 'total_applications';
      this.totalAppPage = 1;
      this.loadStudents('remaining_applications');
      this.scrollTo('total-apps');
    }
    else if (stat === 'remaining_applications') {
      this.currentAppTab = 'remaining_applications';
      this.totalAppPage = 1;
      this.loadStudents('remaining_applications');
      this.scrollTo('total-apps');
    }
    else if (stat === 'cancelled_applications') {
      this.cancelledAppPage = 1;
      this.loadStudents('cancelled_applications');
      this.scrollTo('cancelled-apps');
    }
    else if (stat === 'total_admissions') {
      this.currentAdmTab = 'confirmed_admissions';
      this.totalAdmPage = 1;
      this.loadStudents('confirmed_admissions');
      this.scrollTo('total-adms');
    }
    else if (stat === 'cancelled_admissions') {
      this.cancelledAdmPage = 1;
      this.loadStudents('cancelled_admissions');
      this.scrollTo('cancelled-adms');
    }
    else if (stat === 'scholar_applications') {
      this.currentAppTab = 'total_applications';
      this.appFilterScholar = true;
      this.totalAppPage = 1;
      this.loadStudents('remaining_applications');
      this.scrollTo('total-apps');
    }
    else if (stat === 'scholar_admissions') {
      this.admFilterScholar = true;
      this.totalAdmPage = 1;
      this.loadStudents('confirmed_admissions');
      this.scrollTo('total-adms');
    }
    else if (stat === 'foc_admissions') {
      this.admFilterFoc = true;
      this.totalAdmPage = 1;
      this.loadStudents('confirmed_admissions');
      this.scrollTo('total-adms');
    }
    else if (stat === 'sbs_admissions') {
      this.admFilterSbs = true;
      this.totalAdmPage = 1;
      this.loadStudents('confirmed_admissions');
      this.scrollTo('total-adms');
    }
    else if (stat === 'direct_applications') {
      this.currentAppTab = 'total_applications';
      this.appFilterSource = 'USER';
      this.totalAppPage = 1;
      this.loadStudents('remaining_applications');
      this.scrollTo('total-apps');
    }
    else if (stat === 'direct_admissions') {
      this.admFilterSource = 'USER';
      this.totalAdmPage = 1;
      this.loadStudents('confirmed_admissions');
      this.scrollTo('total-adms');
    }
    else if (stat === 'consultancy_applications') {
      this.currentAppTab = 'total_applications';
      this.appFilterSource = 'CONSULTANCY';
      this.totalAppPage = 1;
      this.loadStudents('remaining_applications');
      this.scrollTo('total-apps');
    }
    else if (stat === 'consultancy_admissions') {
      this.admFilterSource = 'CONSULTANCY';
      this.totalAdmPage = 1;
      this.loadStudents('confirmed_admissions');
      this.scrollTo('total-adms');
    }
    else if (stat === 'duplicate_applications') {
      this.currentAppTab = 'total_applications';
      this.appFilterDuplicate = true;
      this.totalAppPage = 1;
      this.loadStudents('remaining_applications');
      this.scrollTo('total-apps');
    }
    else if (stat === 'duplicate_admissions') {
      this.admFilterDuplicate = true;
      this.totalAdmPage = 1;
      this.loadStudents('confirmed_admissions');
      this.scrollTo('total-adms');
    }
  }

  // ---- Export ----
  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    window.URL.revokeObjectURL(url); document.body.removeChild(a);
  }

  exportStudents(tab: string): void {
    const key = `students_${tab}`;
    this.exporting[key] = true;
    let search = '', source = '', scholar: boolean | null = null;
    let duplicateOnly: boolean | null = null;
    let showOnlyFoc: boolean | null = null;
    let showOnlySbs: boolean | null = null;

    if (tab === 'remaining_applications') {
      search = this.totalAppSearch;
      source = this.appFilterSource || '';
      scholar = this.appFilterScholar;
      duplicateOnly = this.appFilterDuplicate;
      showOnlyFoc = this.appFilterFoc;
      showOnlySbs = this.appFilterSbs;
      tab = this.currentAppTab;
    }
    else if (tab === 'confirmed_admissions') {
      search = this.totalAdmSearch;
      source = this.admFilterSource || '';
      scholar = this.admFilterScholar;
      duplicateOnly = this.admFilterDuplicate;
      showOnlyFoc = this.admFilterFoc;
      showOnlySbs = this.admFilterSbs;
      tab = this.currentAdmTab;
    }
    else if (tab === 'cancelled_applications') { search = this.cancelledAppSearch; }
    else if (tab === 'cancelled_admissions') { search = this.cancelledAdmSearch; }

    this.locationAnalyticsService.exportStateStudents(
      this.stateName, tab, search, source, scholar, duplicateOnly, showOnlyFoc, showOnlySbs
    ).subscribe({
      next: (blob) => { this.downloadBlob(blob, `State_${this.stateName}_${tab}.xlsx`); this.exporting[key] = false; },
      error: (err) => { console.error(err); this.exporting[key] = false; }
    });
  }

  exportUsers(): void {
    this.exporting['users'] = true;
    this.locationAnalyticsService.exportStateUsers(this.stateName, undefined, this.userSortBy, this.userSortDir).subscribe({
      next: (blob) => { this.downloadBlob(blob, `State_${this.stateName}_Users.xlsx`); this.exporting['users'] = false; },
      error: (err) => { console.error(err); this.exporting['users'] = false; }
    });
  }

  exportConsultancies(): void {
    this.exporting['consultancies'] = true;
    this.locationAnalyticsService.exportStateConsultancies(this.stateName, undefined, this.consSortBy, this.consSortDir).subscribe({
      next: (blob) => { this.downloadBlob(blob, `State_${this.stateName}_Consultancies.xlsx`); this.exporting['consultancies'] = false; },
      error: (err) => { console.error(err); this.exporting['consultancies'] = false; }
    });
  }

  exportInstitutions(): void {
    this.exporting['institutions'] = true;
    this.locationAnalyticsService.exportStateInstitutions(this.stateName, undefined, this.instSortBy, this.instSortDir).subscribe({
      next: (blob) => { this.downloadBlob(blob, `State_${this.stateName}_Institutions.xlsx`); this.exporting['institutions'] = false; },
      error: (err) => { console.error(err); this.exporting['institutions'] = false; }
    });
  }

  exportCourses(): void {
    this.exporting['courses'] = true;
    this.locationAnalyticsService.exportStateCourses(this.stateName, undefined, this.courseSortBy, this.courseSortDir).subscribe({
      next: (blob) => { this.downloadBlob(blob, `State_${this.stateName}_Courses.xlsx`); this.exporting['courses'] = false; },
      error: (err) => { console.error(err); this.exporting['courses'] = false; }
    });
  }

  exportCities(): void {
    this.exporting['cities'] = true;
    this.locationAnalyticsService.exportStateCities(this.stateName, undefined, this.citySortBy, this.citySortDir).subscribe({
      next: (blob) => { this.downloadBlob(blob, `State_${this.stateName}_Cities.xlsx`); this.exporting['cities'] = false; },
      error: (err) => { console.error(err); this.exporting['cities'] = false; }
    });
  }

  exportCourseTypes(): void {
    this.exporting['courseTypes'] = true;
    this.locationAnalyticsService.exportStateCourseTypes(this.stateName).subscribe({
      next: (blob) => { this.downloadBlob(blob, `State_${this.stateName}_CourseTypes.xlsx`); this.exporting['courseTypes'] = false; },
      error: (err) => { console.error(err); this.exporting['courseTypes'] = false; }
    });
  }

  exportLeadSources(): void {
    this.exporting['leadSources'] = true;
    this.locationAnalyticsService.exportStateLeadSources(this.stateName).subscribe({
      next: (blob) => { this.downloadBlob(blob, `State_${this.stateName}_LeadSources.xlsx`); this.exporting['leadSources'] = false; },
      error: (err) => { console.error(err); this.exporting['leadSources'] = false; }
    });
  }

  // ---- Analytics Modal ----
  onViewDetails(userId: number, userName: string, initialTab: string, city?: string, state?: string): void {
    this.modalUserId = userId; this.modalUserName = userName; this.modalInitialTab = initialTab;
    this.modalCity = city || '';
    this.modalState = state || this.stateName || '';
    this.showAnalyticsModal = true;
    this.router.navigate([], { 
      relativeTo: this.route, 
      queryParams: { 
        showAnalyticsModal: 'true', 
        modalUserId: userId, 
        modalUserName: userName, 
        modalInitialTab: initialTab,
        modalCity: city || null,
        modalState: this.stateName || null
      }, 
      queryParamsHandling: 'merge' 
    });
  }

  onCloseAnalyticsModal(): void {
    this.showAnalyticsModal = false;
    this.router.navigate([], { 
      queryParams: { 
        showAnalyticsModal: null, 
        modalUserId: null, 
        modalUserName: null, 
        modalInitialTab: null,
        modalCity: null,
        modalState: null
      }, 
      queryParamsHandling: 'merge' 
    });
  }

  // ---- Navigation ----
  goBack(): void { this.router.navigate(['/location-analytics/states']); }
  onViewAdmission(id: number): void { this.router.navigate(['/admissions', id]); }
  onViewUser(userId: number): void { this.router.navigate(['/users', userId]); }
  onViewCourse(id: number): void { this.router.navigate(['/courses', id]); }
  onViewConsultancy(id: number): void { this.router.navigate(['/consultancy', id]); }
  onViewInstitution(id: number): void { this.router.navigate(['/institutions', id]); }
  onViewCity(cityId: number): void { this.router.navigate(['/location-analytics/cities', cityId]); }

  scrollTo(id: string): void {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Getters
  get paginatedTotalApplications(): any[] { return this.totalApplications(); }
  get paginatedCancelledApplications(): any[] { return this.cancelledApplications(); }
  get paginatedTotalAdmissions(): any[] { return this.totalAdmissions(); }
  get paginatedCancelledAdmissions(): any[] { return this.cancelledAdmissions(); }
  get paginatedUsers(): UserBreakdown[] { return this.userBreakdownList(); }
  get paginatedConsultancies(): ConsultancyBreakdown[] { return this.consultancyList(); }
  get paginatedInstitutions(): InstitutionBreakdown[] { return this.institutionList(); }
  get paginatedCourses(): CourseBreakdown[] { return this.courseList(); }
  get paginatedCities(): CityBreakdown[] { return this.cityBreakdownList(); }
}
