import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subject, Subscription, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { FilterDrawerComponent } from '../../shared/components/filter-drawer/filter-drawer.component';
import { MultiSelectModalComponent } from '../../shared/components/multi-select-modal/multi-select-modal.component';
import { LocationAnalyticsService } from '../../core/services/location-analytics.service';
import { LocationAnalyticsDTO } from '../../core/models/location-analytics.model';

// Service Imports for Filters
import { CourseService } from '../../core/services/course.service';
import { ConsultancyService } from '../../core/services/consultancy.service';
import { UserService } from '../../core/services/user.service';
import { LeadSourceService } from '../../core/services/lead-source.service';
import { CourseTypeService } from '../../core/services/course-type.service';
import { LocationService } from '../../core/services/location.service';

@Component({
  selector: 'app-location-analytics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SidebarComponent,
    TopbarComponent,
    FilterDrawerComponent,
    MultiSelectModalComponent
  ],
  templateUrl: './location-analytics.component.html',
  styleUrl: './location-analytics.component.scss'
})
export class LocationAnalyticsComponent implements OnInit, OnDestroy {
  // Data Lists
  topCitiesByApps: LocationAnalyticsDTO[] = [];
  topCitiesByAdms: LocationAnalyticsDTO[] = [];
  topStatesByApps: LocationAnalyticsDTO[] = [];
  topStatesByAdms: LocationAnalyticsDTO[] = [];

  // Summary Metrics
  topCityByAppsName = 'N/A';
  topCityByAppsCount = 0;
  topCityByAdmsName = 'N/A';
  topCityByAdmsCount = 0;
  totalCitiesCount = 0;

  topStateByAppsName = 'N/A';
  topStateByAppsCount = 0;
  topStateByAdmsName = 'N/A';
  topStateByAdmsCount = 0;
  totalStatesCount = 0;

  // UI States
  loading = true;
  showFilterDrawer = false;
  activeFilterCount = 0;
  searchTerm = '';
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  // Filters object mapping exactly to AdmissionPageRequest fields
  filters: any = {
    search: '',
    statusFilter: '',
    states: [],
    cities: [],
    courseTypes: [],
    courseIds: [],
    sessions: [],
    leadSources: [],
    userIds: [],
    consultancyIds: [],
    focType: '',
    showOnlyFoc: null,
    showOnlySbs: null,
    showOnlyPaid: null,
    isScholar: '',
    duplicateOnly: null,
    excludeDuplicate: true,
    includeDuplicate: null,
    startDate: '',
    endDate: '',
    appStartDate: '',
    appEndDate: '',
    admStartDate: '',
    admEndDate: '',
    appDateRangeType: '',
    admDateRangeType: ''
  };

  // Dropdown visibility states
  dropdowns = {
    session: false,
    admissionType: false,
    leadSource: false,
    state: false,
    city: false,
    courseType: false
  };

  // Filter option lists loaded from services
  sessionsList: string[] = (() => {
    const currentYear = new Date().getFullYear();
    const result = [];
    for (let i = 4; i >= 0; i--) {
      result.push((currentYear - i).toString());
    }
    return result;
  })();
  courseTypes: any[] = [];
  leadSources: any[] = [];
  statesList: string[] = [];
  citiesList: string[] = [];
  loadingCities = false;

  // Searchable Selector Modal State
  activeModal: 'user' | 'consultancy' | 'course' | null = null;
  modalItems: any[] = [];
  modalLoading: boolean = false;
  modalSearchText: string = '';
  modalCurrentPage: number = 1;
  modalTotalPages: number = 1;
  modalTotalElements: number = 0;
  modalPageSize: number = 10;

  // Selection Cache Map
  modalSelectionCache: Map<any, any> = new Map();

  // Search filter options in dropdowns
  searchTerms = {
    session: '',
    admissionType: '',
    leadSource: '',
    state: '',
    city: '',
    courseType: ''
  };

  // Injecting services
  private locationAnalyticsService = inject(LocationAnalyticsService);
  private courseService = inject(CourseService);
  private consultancyService = inject(ConsultancyService);
  private userService = inject(UserService);
  private leadSourceService = inject(LeadSourceService);
  private courseTypeService = inject(CourseTypeService);
  private locationService = inject(LocationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  constructor() {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(term => {
      this.filters.search = term;
      this.applyFiltersAndReload();
    });
  }

  ngOnInit(): void {
    // 1. Load Filter options
    this.loadFilterOptions();

    // 2. Parse query parameters to restore filter state
    this.route.queryParams.subscribe(params => {
      this.parseQueryParams(params);
      this.loadAllAnalytics();
    });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  private loadFilterOptions(): void {
    // States
    this.locationService.getAllStates().subscribe({
      next: (data) => {
        this.statesList = data;
        if (this.filters.states && this.filters.states.length > 0) {
          this.loadCitiesForSelectedStates();
        }
      },
      error: (err) => console.error('Error loading states', err)
    });

    // Lead Sources
    this.leadSourceService.getActive().subscribe({
      next: (res: any) => this.leadSources = res?.data || [],
      error: (err) => console.error('Error loading active lead sources', err)
    });

    // Course Types
    this.courseTypeService.getActiveCourseTypes().subscribe({
      next: (res: any[]) => this.courseTypes = res || [],
      error: (err) => console.error('Error loading active course types', err)
    });
  }

  private parseQueryParams(params: any): void {
    // Parse search
    this.searchTerm = params.search || '';
    this.filters.search = this.searchTerm;

    // Parse single selects
    this.filters.isScholar = params.isScholar !== undefined ? params.isScholar : '';
    this.filters.statusFilter = params.statusFilter || '';
    this.filters.focType = params.focType || '';

    // Parse dates
    this.filters.startDate = params.startDate || '';
    this.filters.endDate = params.endDate || '';
    this.filters.appStartDate = params.appStartDate || '';
    this.filters.appEndDate = params.appEndDate || '';
    this.filters.admStartDate = params.admStartDate || '';
    this.filters.admEndDate = params.admEndDate || '';
    this.filters.appDateRangeType = params.appDateRangeType || '';
    this.filters.admDateRangeType = params.admDateRangeType || '';

    // Parse FOC indicators
    this.filters.showOnlyPaid = params.showOnlyPaid === 'true' ? true : (params.showOnlyPaid === 'false' ? false : null);
    this.filters.showOnlyFoc = params.showOnlyFoc === 'true' ? true : (params.showOnlyFoc === 'false' ? false : null);
    this.filters.showOnlySbs = params.showOnlySbs === 'true' ? true : (params.showOnlySbs === 'false' ? false : null);

    // Parse duplicates
    this.filters.duplicateOnly = params.duplicateOnly === 'true' ? true : (params.duplicateOnly === 'false' ? false : null);
    this.filters.excludeDuplicate = params.excludeDuplicate === 'false' ? false : true; // Default true
    this.filters.includeDuplicate = params.includeDuplicate === 'true' ? true : (params.includeDuplicate === 'false' ? false : null);

    // Parse multi-select arrays (split by comma)
    this.filters.states = params.states ? params.states.split(',') : [];
    this.filters.cities = params.cities ? params.cities.split(',') : [];
    this.filters.courseTypes = params.courseTypes ? params.courseTypes.split(',') : [];
    this.filters.sessions = params.sessions ? params.sessions.split(',') : [];
    this.filters.leadSources = params.leadSources ? params.leadSources.split(',') : [];
    this.filters.courseIds = params.courseIds ? params.courseIds.split(',').map((id: string) => +id) : [];
    this.filters.userIds = params.userIds ? params.userIds.split(',').map((id: string) => +id) : [];
    this.filters.consultancyIds = params.consultancyIds ? params.consultancyIds.split(',').map((id: string) => +id) : [];

    this.calculateActiveFilterCount();
  }

  private calculateActiveFilterCount(): void {
    let count = 0;

    // Check simple strings/booleans
    if (this.filters.isScholar !== '') count++;
    if (this.filters.statusFilter !== '') count++;
    if (this.filters.focType !== '') count++;
    if (this.filters.showOnlyPaid != null) count++;
    if (this.filters.showOnlyFoc != null) count++;
    if (this.filters.showOnlySbs != null) count++;
    if (this.filters.appDateRangeType !== '') count++;
    if (this.filters.admDateRangeType !== '') count++;
    if (this.filters.duplicateOnly != null) count++;

    // Check arrays
    if (this.filters.states.length > 0) count++;
    if (this.filters.cities.length > 0) count++;
    if (this.filters.courseTypes.length > 0) count++;
    if (this.filters.sessions.length > 0) count++;
    if (this.filters.leadSources.length > 0) count++;
    if (this.filters.courseIds.length > 0) count++;
    if (this.filters.userIds.length > 0) count++;
    if (this.filters.consultancyIds.length > 0) count++;

    this.activeFilterCount = count;
  }

  loadAllAnalytics(): void {
    this.loading = true;

    // Build the request payload matching backend model
    const requestPayload = { ...this.filters };

    // Fetch all top rankings in parallel
    this.locationAnalyticsService.getTopCitiesByApplications(requestPayload).subscribe({
      next: (data) => {
        this.topCitiesByApps = data;
        if (data.length > 0) {
          this.topCityByAppsName = `${data[0].city}, ${data[0].state}`;
          this.topCityByAppsCount = data[0].totalApplications;
        } else {
          this.topCityByAppsName = 'N/A';
          this.topCityByAppsCount = 0;
        }
      },
      error: (err) => console.error('Error loading top cities by apps', err)
    });

    this.locationAnalyticsService.getTopCitiesByAdmissions(requestPayload).subscribe({
      next: (data) => {
        this.topCitiesByAdms = data;
        if (data.length > 0) {
          this.topCityByAdmsName = `${data[0].city}, ${data[0].state}`;
          this.topCityByAdmsCount = data[0].totalAdmissions;
        } else {
          this.topCityByAdmsName = 'N/A';
          this.topCityByAdmsCount = 0;
        }
      },
      error: (err) => console.error('Error loading top cities by adms', err)
    });

    this.locationAnalyticsService.getTopStatesByApplications(requestPayload).subscribe({
      next: (data) => {
        this.topStatesByApps = data;
        if (data.length > 0) {
          this.topStateByAppsName = data[0].state;
          this.topStateByAppsCount = data[0].totalApplications;
        } else {
          this.topStateByAppsName = 'N/A';
          this.topStateByAppsCount = 0;
        }
      },
      error: (err) => console.error('Error loading top states by apps', err)
    });

    this.locationAnalyticsService.getTopStatesByAdmissions(requestPayload).subscribe({
      next: (data) => {
        this.topStatesByAdms = data;
        if (data.length > 0) {
          this.topStateByAdmsName = data[0].state;
          this.topStateByAdmsCount = data[0].totalAdmissions;
        } else {
          this.topStateByAdmsName = 'N/A';
          this.topStateByAdmsCount = 0;
        }
      },
      error: (err) => console.error('Error loading top states by adms', err)
    });

    // Load total counts from paginated listings
    this.locationAnalyticsService.getCitiesAnalytics({ ...requestPayload, page: 1, size: 1 }).subscribe({
      next: (res) => {
        this.totalCitiesCount = res.totalElements || 0;
      },
      error: (err) => console.error('Error fetching total cities count', err)
    });

    this.locationAnalyticsService.getStatesAnalytics({ ...requestPayload, page: 1, size: 1 }).subscribe({
      next: (res) => {
        this.totalStatesCount = res.totalElements || 0;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching total states count', err);
        this.loading = false;
      }
    });
  }

  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  applyFiltersAndReload(): void {
    this.showFilterDrawer = false;
    this.calculateActiveFilterCount();

    // Map properties to query parameters in URL
    const queryParams: any = {};
    if (this.filters.search) queryParams.search = this.filters.search;
    if (this.filters.isScholar !== '') queryParams.isScholar = this.filters.isScholar;
    if (this.filters.statusFilter !== '') queryParams.statusFilter = this.filters.statusFilter;
    if (this.filters.focType !== '') queryParams.focType = this.filters.focType;

    // Date filters
    if (this.filters.startDate) queryParams.startDate = this.filters.startDate;
    if (this.filters.endDate) queryParams.endDate = this.filters.endDate;
    if (this.filters.appStartDate) queryParams.appStartDate = this.filters.appStartDate;
    if (this.filters.appEndDate) queryParams.appEndDate = this.filters.appEndDate;
    if (this.filters.admStartDate) queryParams.admStartDate = this.filters.admStartDate;
    if (this.filters.admEndDate) queryParams.admEndDate = this.filters.admEndDate;
    if (this.filters.appDateRangeType) queryParams.appDateRangeType = this.filters.appDateRangeType;
    if (this.filters.admDateRangeType) queryParams.admDateRangeType = this.filters.admDateRangeType;

    // FOC flags
    if (this.filters.showOnlyPaid != null) queryParams.showOnlyPaid = this.filters.showOnlyPaid.toString();
    if (this.filters.showOnlyFoc != null) queryParams.showOnlyFoc = this.filters.showOnlyFoc.toString();
    if (this.filters.showOnlySbs != null) queryParams.showOnlySbs = this.filters.showOnlySbs.toString();

    // Duplicates flags
    if (this.filters.duplicateOnly != null) queryParams.duplicateOnly = this.filters.duplicateOnly.toString();
    if (this.filters.excludeDuplicate === false) queryParams.excludeDuplicate = 'false';
    if (this.filters.includeDuplicate != null) queryParams.includeDuplicate = this.filters.includeDuplicate.toString();

    // Multi select arrays
    if (this.filters.states.length > 0) queryParams.states = this.filters.states.join(',');
    if (this.filters.cities.length > 0) queryParams.cities = this.filters.cities.join(',');
    if (this.filters.courseTypes.length > 0) queryParams.courseTypes = this.filters.courseTypes.join(',');
    if (this.filters.sessions.length > 0) queryParams.sessions = this.filters.sessions.join(',');
    if (this.filters.leadSources.length > 0) queryParams.leadSources = this.filters.leadSources.join(',');
    if (this.filters.courseIds.length > 0) queryParams.courseIds = this.filters.courseIds.join(',');
    if (this.filters.userIds.length > 0) queryParams.userIds = this.filters.userIds.join(',');
    if (this.filters.consultancyIds.length > 0) queryParams.consultancyIds = this.filters.consultancyIds.join(',');

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      replaceUrl: true
    });
  }

  resetFilters(): void {
    this.filters = {
      search: '',
      statusFilter: '',
      states: [],
      cities: [],
      courseTypes: [],
      courseIds: [],
      sessions: [],
      leadSources: [],
      userIds: [],
      consultancyIds: [],
      focType: '',
      showOnlyFoc: null,
      showOnlySbs: null,
      showOnlyPaid: null,
      isScholar: '',
      duplicateOnly: null,
      excludeDuplicate: true,
      includeDuplicate: null,
      startDate: '',
      endDate: '',
      appStartDate: '',
      appEndDate: '',
      admStartDate: '',
      admEndDate: '',
      appDateRangeType: '',
      admDateRangeType: ''
    };
    this.searchTerm = '';
    this.applyFiltersAndReload();
  }

  refreshData(): void {
    this.loadAllAnalytics();
  }

  placeholderDownload(): void {
    alert('Excel Report Download placeholder triggered. Future reporting extension template is ready.');
  }

  // ── Searchable Modal Selector Helpers ─────────────────────────────
  cacheSelectedItem(item: any) {
    if (!item) return;
    const id = this.getItemId(item);
    if (id !== null && id !== undefined) {
      this.modalSelectionCache.set(id, item);
    }
  }

  getItemId(item: any): any {
    if (!item) return null;
    if (item.userId !== undefined && item.userId !== null) return item.userId;
    if (item.courseId !== undefined && item.courseId !== null) return item.courseId;
    return item.id;
  }

  getSelectedUsers(): any[] {
    if (!this.filters.userIds) return [];
    return this.filters.userIds.map((id: any) => this.modalSelectionCache.get(id) || { id, userId: id, fullName: `User ID: ${id}` });
  }

  getSelectedConsultancies(): any[] {
    if (!this.filters.consultancyIds) return [];
    return this.filters.consultancyIds.map((id: any) => this.modalSelectionCache.get(id) || { id, name: `Consultancy ID: ${id}` });
  }

  getSelectedCourses(): any[] {
    if (!this.filters.courseIds) return [];
    return this.filters.courseIds.map((id: any) => this.modalSelectionCache.get(id) || { id, courseId: id, name: `Course ID: ${id}` });
  }

  openUserFilter() {
    this.activeModal = 'user';
    this.modalCurrentPage = 1;
    this.modalSearchText = '';
    this.loadModalData();
  }

  openConsultancyFilter() {
    this.activeModal = 'consultancy';
    this.modalCurrentPage = 1;
    this.modalSearchText = '';
    this.loadModalData();
  }

  openCourseFilter() {
    this.activeModal = 'course';
    this.modalCurrentPage = 1;
    this.modalSearchText = '';
    this.loadModalData();
  }

  loadModalData() {
    this.modalLoading = true;
    this.modalItems = [];
    if (this.activeModal === 'user') {
      this.userService.getUsersPaged(
        this.modalCurrentPage - 1,
        this.modalPageSize,
        this.modalSearchText,
        '',
        'ACTIVE'
      ).subscribe({
        next: (res: any) => {
          this.modalItems = res.content || [];
          this.modalTotalElements = res.totalElements || 0;
          this.modalTotalPages = res.totalPages || 0;
          this.modalLoading = false;
        },
        error: (err) => {
          console.error('Error loading user modal data', err);
          this.modalLoading = false;
        }
      });
    } else if (this.activeModal === 'consultancy') {
      this.consultancyService.getConsultancyPage({
        page: this.modalCurrentPage - 1,
        size: this.modalPageSize,
        search: this.modalSearchText || undefined,
        status: 'ACTIVE'
      }).subscribe({
        next: (res: any) => {
          this.modalItems = res.content || [];
          this.modalTotalElements = res.totalElements || 0;
          this.modalTotalPages = res.totalPages || 0;
          this.modalLoading = false;
        },
        error: (err) => {
          console.error('Error loading consultancy modal data', err);
          this.modalLoading = false;
        }
      });
    } else if (this.activeModal === 'course') {
      this.courseService.getCoursesPaged(
        this.modalCurrentPage - 1,
        this.modalPageSize,
        this.modalSearchText,
        true
      ).subscribe({
        next: (res: any) => {
          this.modalItems = res.content || [];
          this.modalTotalElements = res.totalElements || 0;
          this.modalTotalPages = res.totalPages || 0;
          this.modalLoading = false;
        },
        error: (err) => {
          console.error('Error loading course modal data', err);
          this.modalLoading = false;
        }
      });
    }
  }

  onModalSearch(term: string) {
    this.modalSearchText = term;
    this.modalCurrentPage = 1;
    this.loadModalData();
  }

  onModalPageChange(page: number) {
    this.modalCurrentPage = page;
    this.loadModalData();
  }

  onModalSelect(items: any[]) {
    if (!items) {
      this.activeModal = null;
      return;
    }
    items.forEach(item => this.cacheSelectedItem(item));
    const ids: number[] = items.map(item => {
      const raw = typeof item === 'object' && item !== null ? this.getItemId(item) : item;
      return Number(raw);
    }).filter(id => !isNaN(id) && id > 0);

    if (this.activeModal === 'user') {
      this.filters.userIds = ids;
    } else if (this.activeModal === 'consultancy') {
      this.filters.consultancyIds = ids;
    } else if (this.activeModal === 'course') {
      this.filters.courseIds = ids;
    }
    this.activeModal = null;
    this.calculateActiveFilterCount();
  }

  onModalClose() {
    this.activeModal = null;
  }

  // ── Multi-select Helpers ──────────────────────────────────────────────
  toggleSessionSelection(session: string): void {
    const idx = this.filters.sessions.indexOf(session);
    if (idx > -1) {
      this.filters.sessions.splice(idx, 1);
    } else {
      this.filters.sessions.push(session);
    }
  }

  toggleCourseSelection(id: number): void {
    const idx = this.filters.courseIds.indexOf(id);
    if (idx > -1) {
      this.filters.courseIds.splice(idx, 1);
    } else {
      this.filters.courseIds.push(id);
    }
  }

  toggleConsultancySelection(id: number): void {
    const idx = this.filters.consultancyIds.indexOf(id);
    if (idx > -1) {
      this.filters.consultancyIds.splice(idx, 1);
    } else {
      this.filters.consultancyIds.push(id);
    }
  }

  toggleUserSelection(id: number): void {
    const idx = this.filters.userIds.indexOf(id);
    if (idx > -1) {
      this.filters.userIds.splice(idx, 1);
    } else {
      this.filters.userIds.push(id);
    }
  }

  toggleCourseTypeSelection(name: string): void {
    const idx = this.filters.courseTypes.indexOf(name);
    if (idx > -1) {
      this.filters.courseTypes.splice(idx, 1);
    } else {
      this.filters.courseTypes.push(name);
    }
  }

  toggleLeadSourceSelection(id: string): void {
    const idx = this.filters.leadSources.indexOf(id);
    if (idx > -1) {
      this.filters.leadSources.splice(idx, 1);
    } else {
      this.filters.leadSources.push(id);
    }
  }

  toggleStateSelection(state: string): void {
    const idx = this.filters.states.indexOf(state);
    if (idx > -1) {
      this.filters.states.splice(idx, 1);
    } else {
      this.filters.states.push(state);
    }
    this.filters.cities = []; // Clear city selections when state choices change
    this.loadCitiesForSelectedStates();
  }

  toggleCitySelection(city: string): void {
    const idx = this.filters.cities.indexOf(city);
    if (idx > -1) {
      this.filters.cities.splice(idx, 1);
    } else {
      this.filters.cities.push(city);
    }
  }

  // City-State loader helpers
  loadCities(state: string): void {
    this.loadingCities = true;
    this.locationService.getCitiesByState(state).subscribe({
      next: (data) => {
        this.citiesList = data;
        this.loadingCities = false;
      },
      error: (err) => {
        console.error('Error loading cities', err);
        this.loadingCities = false;
      }
    });
  }

  loadCitiesForSelectedStates(): void {
    if (!this.filters.states || this.filters.states.length === 0) {
      this.citiesList = [];
      this.filters.cities = [];
      return;
    }
    this.loadingCities = true;
    const obs = (this.filters.states as string[]).map((state: string) => this.locationService.getCitiesByState(state));
    forkJoin(obs).subscribe({
      next: (results: string[][]) => {
        const allCities = results.reduce((acc, val) => acc.concat(val), []);
        this.citiesList = Array.from(new Set(allCities)).sort();
        this.filters.cities = this.filters.cities.filter((c: string) => this.citiesList.includes(c));
        this.loadingCities = false;
      },
      error: (err) => {
        console.error('Error loading cities for selected states', err);
        this.loadingCities = false;
      }
    });
  }

  // Option text resolve helpers
  getCourseNameById(id: number): string {
    const item = this.modalSelectionCache.get(id);
    return item ? item.name : `Course #${id}`;
  }

  getConsultancyNameById(id: number): string {
    const item = this.modalSelectionCache.get(id);
    return item ? item.name : `Consultancy #${id}`;
  }

  getUserNameById(id: number): string {
    const item = this.modalSelectionCache.get(id);
    return item ? (item.fullName || item.name) : `User #${id}`;
  }

  getLeadSourceNameById(id: string): string {
    const item = this.leadSources.find(l => l.id === id);
    return item ? item.name : `Source #${id}`;
  }

  // Date handlers
  onDateRangeTypeChange(type: 'application' | 'admission'): void {
    const rangeType = type === 'application' ? this.filters.appDateRangeType : this.filters.admDateRangeType;
    let start = '';
    let end = '';

    if (rangeType && rangeType !== 'custom') {
      const today = new Date();
      if (rangeType === 'today') {
        start = this.formatDate(today);
        end = this.formatDate(today);
      } else if (rangeType === 'week') {
        const first = today.getDate() - today.getDay();
        const last = first + 6;
        start = this.formatDate(new Date(today.setDate(first)));
        end = this.formatDate(new Date(today.setDate(last)));
      } else if (rangeType === 'month') {
        const y = today.getFullYear();
        const m = today.getMonth();
        start = this.formatDate(new Date(y, m, 1));
        end = this.formatDate(new Date(y, m + 1, 0));
      }

      if (type === 'application') {
        this.filters.appStartDate = start;
        this.filters.appEndDate = end;
        this.filters.startDate = start;
        this.filters.endDate = end;
      } else {
        this.filters.admStartDate = start;
        this.filters.admEndDate = end;
        this.filters.startDate = start;
        this.filters.endDate = end;
      }
    } else if (rangeType === 'custom') {
      // Prompt custom selector
    } else {
      if (type === 'application') {
        this.filters.appStartDate = '';
        this.filters.appEndDate = '';
        this.filters.startDate = '';
        this.filters.endDate = '';
      } else {
        this.filters.admStartDate = '';
        this.filters.admEndDate = '';
        this.filters.startDate = '';
        this.filters.endDate = '';
      }
    }
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }

  // Duplicate settings
  getDuplicateFilterValue(): string {
    if (this.filters.duplicateOnly === true) return 'only';
    if (this.filters.includeDuplicate === true) return 'all';
    return 'exclude';
  }

  setDuplicateFilterValue(val: string): void {
    if (val === 'only') {
      this.filters.duplicateOnly = true;
      this.filters.excludeDuplicate = false;
      this.filters.includeDuplicate = false;
    } else if (val === 'all') {
      this.filters.duplicateOnly = false;
      this.filters.excludeDuplicate = false;
      this.filters.includeDuplicate = true;
    } else {
      this.filters.duplicateOnly = false;
      this.filters.excludeDuplicate = true;
      this.filters.includeDuplicate = false;
    }
  }

  // Dropdown search filters
  get filteredSessions(): string[] {
    const q = this.searchTerms.session.toLowerCase().trim();
    return this.sessionsList.filter(s => s.toLowerCase().includes(q));
  }

  get filteredLeadSources(): any[] {
    const q = this.searchTerms.leadSource.toLowerCase().trim();
    return this.leadSources.filter(l => l.name.toLowerCase().includes(q));
  }

  get filteredStates(): string[] {
    const q = this.searchTerms.state.toLowerCase().trim();
    return this.statesList.filter(s => s.toLowerCase().includes(q));
  }

  get filteredCities(): string[] {
    const q = this.searchTerms.city.toLowerCase().trim();
    return this.citiesList.filter(c => c.toLowerCase().includes(q));
  }

  get filteredCourseTypes(): any[] {
    const q = this.searchTerms.courseType.toLowerCase().trim();
    return this.courseTypes.filter(c => c.name.toLowerCase().includes(q));
  }
}
