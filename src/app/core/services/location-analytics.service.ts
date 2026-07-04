import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  LocationAnalyticsDTO,
  CityDetailDTO,
  StateDetailDTO,
  GenderDetailDTO,
  CasteDetailDTO,
  UserBreakdown,
  ConsultancyBreakdown,
  InstitutionBreakdown,
  CourseBreakdown,
  CourseTypeBreakdown,
  LeadSourceBreakdown,
  CityBreakdown,
  PageResponse
} from '../models/location-analytics.model';

@Injectable({
  providedIn: 'root'
})
export class LocationAnalyticsService {
  private apiUrl = `${environment.apiUrl}/analytics`;

  constructor(private http: HttpClient) {}

  private buildParams(filter?: any): HttpParams {
    let params = new HttpParams();
    if (!filter) return params;

    // Pagination
    if (filter.page !== undefined && filter.page !== null) params = params.set('page', filter.page.toString());
    if (filter.size !== undefined && filter.size !== null) params = params.set('size', filter.size.toString());

    // Search & Sort
    if (filter.search) params = params.set('search', filter.search.trim());
    if (filter.sortColumn) params = params.set('sortColumn', filter.sortColumn);
    if (filter.sortDirection) params = params.set('sortDirection', filter.sortDirection);

    // Advanced Filters
    if (filter.tab) params = params.set('tab', filter.tab);
    if (filter.statFilter) params = params.set('statFilter', filter.statFilter);
    if (filter.courseId) params = params.set('courseId', filter.courseId.toString());
    if (filter.statusFilter) params = params.set('statusFilter', filter.statusFilter);
    if (filter.source) params = params.set('source', filter.source);
    if (filter.isScholar != null && filter.isScholar !== '') params = params.set('isScholar', filter.isScholar.toString());
    if (filter.state) params = params.set('state', filter.state);
    if (filter.city) params = params.set('city', filter.city);
    if (filter.session) params = params.set('session', filter.session);
    if (filter.commissionStatus) params = params.set('commissionStatus', filter.commissionStatus);
    if (filter.fiftyPercentFeesPaid !== undefined && filter.fiftyPercentFeesPaid !== null) params = params.set('fiftyPercentFeesPaid', filter.fiftyPercentFeesPaid.toString());
    if (filter.startDate) params = params.set('startDate', filter.startDate);
    if (filter.endDate) params = params.set('endDate', filter.endDate);
    if (filter.leadSourceId) params = params.set('leadSourceId', filter.leadSourceId);
    if (filter.appStartDate) params = params.set('appStartDate', filter.appStartDate);
    if (filter.appEndDate) params = params.set('appEndDate', filter.appEndDate);
    if (filter.admStartDate) params = params.set('admStartDate', filter.admStartDate);
    if (filter.admEndDate) params = params.set('admEndDate', filter.admEndDate);
    if (filter.isDiscounted !== undefined && filter.isDiscounted !== null) params = params.set('isDiscounted', filter.isDiscounted.toString());
    if (filter.consultancyId) params = params.set('consultancyId', filter.consultancyId.toString());
    if (filter.userId) params = params.set('userId', filter.userId.toString());
    if (filter.showOnlyPaid !== undefined && filter.showOnlyPaid !== null) params = params.set('showOnlyPaid', filter.showOnlyPaid.toString());
    if (filter.showOnlyFoc !== undefined && filter.showOnlyFoc !== null) params = params.set('showOnlyFoc', filter.showOnlyFoc.toString());
    if (filter.showOnlySbs !== undefined && filter.showOnlySbs !== null) params = params.set('showOnlySbs', filter.showOnlySbs.toString());

    // Arrays joined by comma
    if (filter.states && filter.states.length > 0) params = params.set('states', filter.states.join(','));
    if (filter.cities && filter.cities.length > 0) params = params.set('cities', filter.cities.join(','));
    if (filter.courseTypes && filter.courseTypes.length > 0) params = params.set('courseTypes', filter.courseTypes.join(','));
    if (filter.sessions && filter.sessions.length > 0) params = params.set('sessions', filter.sessions.join(','));
    if (filter.admissionTypes && filter.admissionTypes.length > 0) params = params.set('admissionTypes', filter.admissionTypes.join(','));
    if (filter.leadSources && filter.leadSources.length > 0) params = params.set('leadSources', filter.leadSources.join(','));
    if (filter.userIds && filter.userIds.length > 0) params = params.set('userIds', filter.userIds.join(','));
    if (filter.consultancyIds && filter.consultancyIds.length > 0) params = params.set('consultancyIds', filter.consultancyIds.join(','));
    if (filter.courseIds && filter.courseIds.length > 0) params = params.set('courseIds', filter.courseIds.join(','));

    // Duplicates
    if (filter.duplicateOnly !== undefined && filter.duplicateOnly !== null) params = params.set('duplicateOnly', filter.duplicateOnly.toString());
    if (filter.excludeDuplicate !== undefined && filter.excludeDuplicate !== null) params = params.set('excludeDuplicate', filter.excludeDuplicate.toString());
    if (filter.includeDuplicate !== undefined && filter.includeDuplicate !== null) params = params.set('includeDuplicate', filter.includeDuplicate.toString());

    return params;
  }

  // ===================== EXISTING LIST ENDPOINTS =====================

  getTopCitiesByApplications(filter?: any): Observable<LocationAnalyticsDTO[]> {
    const params = this.buildParams(filter);
    return this.http.get<any>(`${this.apiUrl}/cities/top-applications`, { params }).pipe(
      map(res => res.data || [])
    );
  }

  getTopCitiesByAdmissions(filter?: any): Observable<LocationAnalyticsDTO[]> {
    const params = this.buildParams(filter);
    return this.http.get<any>(`${this.apiUrl}/cities/top-admissions`, { params }).pipe(
      map(res => res.data || [])
    );
  }

  getTopStatesByApplications(filter?: any): Observable<LocationAnalyticsDTO[]> {
    const params = this.buildParams(filter);
    return this.http.get<any>(`${this.apiUrl}/states/top-applications`, { params }).pipe(
      map(res => res.data || [])
    );
  }

  getTopStatesByAdmissions(filter?: any): Observable<LocationAnalyticsDTO[]> {
    const params = this.buildParams(filter);
    return this.http.get<any>(`${this.apiUrl}/states/top-admissions`, { params }).pipe(
      map(res => res.data || [])
    );
  }

  getCitiesAnalytics(filter?: any): Observable<any> {
    const params = this.buildParams(filter);
    return this.http.get<any>(`${this.apiUrl}/cities`, { params }).pipe(
      map(res => res.data || {})
    );
  }

  getStatesAnalytics(filter?: any): Observable<any> {
    const params = this.buildParams(filter);
    return this.http.get<any>(`${this.apiUrl}/states`, { params }).pipe(
      map(res => res.data || {})
    );
  }

  // ===================== DETAIL ENDPOINTS =====================

  getCityDetail(cityId: number, session?: string): Observable<CityDetailDTO> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    return this.http.get<any>(`${this.apiUrl}/cities/${cityId}/detail`, { params }).pipe(
      map(res => res.data)
    );
  }

  getStateDetail(stateName: string, session?: string): Observable<StateDetailDTO> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    return this.http.get<any>(`${this.apiUrl}/states/${encodeURIComponent(stateName)}/detail`, { params }).pipe(
      map(res => res.data)
    );
  }

  // ===================== USER BREAKDOWN =====================

  getCityUserBreakdown(cityId: number, page: number, size: number, sortBy: string, sortDirection: string, session?: string): Observable<PageResponse<UserBreakdown>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    if (session) params = params.set('session', session);
    return this.http.get<any>(`${this.apiUrl}/cities/${cityId}/users`, { params }).pipe(
      map(res => res.data || { content: [], totalElements: 0 })
    );
  }

  getStateUserBreakdown(stateName: string, page: number, size: number, sortBy: string, sortDirection: string, session?: string): Observable<PageResponse<UserBreakdown>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    if (session) params = params.set('session', session);
    return this.http.get<any>(`${this.apiUrl}/states/${encodeURIComponent(stateName)}/users`, { params }).pipe(
      map(res => res.data || { content: [], totalElements: 0 })
    );
  }

  // ===================== CONSULTANCY BREAKDOWN =====================

  getCityConsultancyBreakdown(cityId: number, page: number, size: number, sortBy: string, sortDirection: string, session?: string): Observable<PageResponse<ConsultancyBreakdown>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    if (session) params = params.set('session', session);
    return this.http.get<any>(`${this.apiUrl}/cities/${cityId}/consultancies`, { params }).pipe(
      map(res => res.data || { content: [], totalElements: 0 })
    );
  }

  getStateConsultancyBreakdown(stateName: string, page: number, size: number, sortBy: string, sortDirection: string, session?: string): Observable<PageResponse<ConsultancyBreakdown>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    if (session) params = params.set('session', session);
    return this.http.get<any>(`${this.apiUrl}/states/${encodeURIComponent(stateName)}/consultancies`, { params }).pipe(
      map(res => res.data || { content: [], totalElements: 0 })
    );
  }

  // ===================== INSTITUTION BREAKDOWN =====================

  getCityInstitutionBreakdown(cityId: number, page: number, size: number, sortBy: string, sortDirection: string, session?: string): Observable<PageResponse<InstitutionBreakdown>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    if (session) params = params.set('session', session);
    return this.http.get<any>(`${this.apiUrl}/cities/${cityId}/institutions`, { params }).pipe(
      map(res => res.data || { content: [], totalElements: 0 })
    );
  }

  getStateInstitutionBreakdown(stateName: string, page: number, size: number, sortBy: string, sortDirection: string, session?: string): Observable<PageResponse<InstitutionBreakdown>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    if (session) params = params.set('session', session);
    return this.http.get<any>(`${this.apiUrl}/states/${encodeURIComponent(stateName)}/institutions`, { params }).pipe(
      map(res => res.data || { content: [], totalElements: 0 })
    );
  }

  // ===================== COURSE BREAKDOWN =====================

  getCityCourseBreakdown(cityId: number, page: number, size: number, sortBy: string, sortDirection: string, session?: string): Observable<PageResponse<CourseBreakdown>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    if (session) params = params.set('session', session);
    return this.http.get<any>(`${this.apiUrl}/cities/${cityId}/courses`, { params }).pipe(
      map(res => res.data || { content: [], totalElements: 0 })
    );
  }

  getStateCourseBreakdown(stateName: string, page: number, size: number, sortBy: string, sortDirection: string, session?: string): Observable<PageResponse<CourseBreakdown>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    if (session) params = params.set('session', session);
    return this.http.get<any>(`${this.apiUrl}/states/${encodeURIComponent(stateName)}/courses`, { params }).pipe(
      map(res => res.data || { content: [], totalElements: 0 })
    );
  }

  // ===================== COURSE TYPE BREAKDOWN =====================

  getCityCourseTypeBreakdown(cityId: number, session?: string): Observable<CourseTypeBreakdown[]> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    return this.http.get<any>(`${this.apiUrl}/cities/${cityId}/course-types`, { params }).pipe(
      map(res => res.data || [])
    );
  }

  getStateCourseTypeBreakdown(stateName: string, session?: string): Observable<CourseTypeBreakdown[]> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    return this.http.get<any>(`${this.apiUrl}/states/${encodeURIComponent(stateName)}/course-types`, { params }).pipe(
      map(res => res.data || [])
    );
  }

  // ===================== LEAD SOURCE BREAKDOWN =====================

  getCityLeadSourceBreakdown(cityId: number, session?: string): Observable<LeadSourceBreakdown[]> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    return this.http.get<any>(`${this.apiUrl}/cities/${cityId}/lead-sources`, { params }).pipe(
      map(res => res.data || [])
    );
  }

  getStateLeadSourceBreakdown(stateName: string, session?: string): Observable<LeadSourceBreakdown[]> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    return this.http.get<any>(`${this.apiUrl}/states/${encodeURIComponent(stateName)}/lead-sources`, { params }).pipe(
      map(res => res.data || [])
    );
  }

  // ===================== CITY BREAKDOWN (state-detail only) =====================

  getStateCityBreakdown(stateName: string, page: number, size: number, sortBy: string, sortDirection: string, session?: string): Observable<PageResponse<CityBreakdown>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    if (session) params = params.set('session', session);
    return this.http.get<any>(`${this.apiUrl}/states/${encodeURIComponent(stateName)}/cities`, { params }).pipe(
      map(res => res.data || { content: [], totalElements: 0 })
    );
  }

  // ===================== STUDENT LIST ENDPOINTS =====================

  getCityStudentsPaged(
    cityId: number,
    page: number,
    size: number,
    tab: string,
    search: string,
    source: string,
    scholar: boolean | null,
    sortBy: string,
    sortDirection: string,
    duplicateOnly?: boolean | null,
    showOnlyFoc?: boolean | null,
    showOnlySbs?: boolean | null
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('tab', tab)
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    if (search) params = params.set('search', search);
    if (source) params = params.set('source', source);
    if (scholar !== null && scholar !== undefined) params = params.set('scholar', scholar.toString());
    if (duplicateOnly !== null && duplicateOnly !== undefined) params = params.set('duplicateOnly', duplicateOnly.toString());
    if (showOnlyFoc !== null && showOnlyFoc !== undefined) params = params.set('showOnlyFoc', showOnlyFoc.toString());
    if (showOnlySbs !== null && showOnlySbs !== undefined) params = params.set('showOnlySbs', showOnlySbs.toString());
    return this.http.get<any>(`${this.apiUrl}/cities/${cityId}/students`, { params }).pipe(
      map(res => res.data || { content: [], totalElements: 0 })
    );
  }

  getStateStudentsPaged(
    stateName: string,
    page: number,
    size: number,
    tab: string,
    search: string,
    source: string,
    scholar: boolean | null,
    sortBy: string,
    sortDirection: string,
    duplicateOnly?: boolean | null,
    showOnlyFoc?: boolean | null,
    showOnlySbs?: boolean | null
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('tab', tab)
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    if (search) params = params.set('search', search);
    if (source) params = params.set('source', source);
    if (scholar !== null && scholar !== undefined) params = params.set('scholar', scholar.toString());
    if (duplicateOnly !== null && duplicateOnly !== undefined) params = params.set('duplicateOnly', duplicateOnly.toString());
    if (showOnlyFoc !== null && showOnlyFoc !== undefined) params = params.set('showOnlyFoc', showOnlyFoc.toString());
    if (showOnlySbs !== null && showOnlySbs !== undefined) params = params.set('showOnlySbs', showOnlySbs.toString());
    return this.http.get<any>(`${this.apiUrl}/states/${encodeURIComponent(stateName)}/students`, { params }).pipe(
      map(res => res.data || { content: [], totalElements: 0 })
    );
  }

  // ===================== EXPORT ENDPOINTS =====================

  exportCityStudents(
    cityId: number,
    tab: string,
    search?: string,
    source?: string,
    scholar?: boolean | null,
    duplicateOnly?: boolean | null,
    showOnlyFoc?: boolean | null,
    showOnlySbs?: boolean | null
  ): Observable<Blob> {
    let params = new HttpParams().set('tab', tab);
    if (search) params = params.set('search', search);
    if (source) params = params.set('source', source);
    if (scholar !== null && scholar !== undefined) params = params.set('scholar', scholar.toString());
    if (duplicateOnly !== null && duplicateOnly !== undefined) params = params.set('duplicateOnly', duplicateOnly.toString());
    if (showOnlyFoc !== null && showOnlyFoc !== undefined) params = params.set('showOnlyFoc', showOnlyFoc.toString());
    if (showOnlySbs !== null && showOnlySbs !== undefined) params = params.set('showOnlySbs', showOnlySbs.toString());
    return this.http.get(`${this.apiUrl}/cities/${cityId}/students/export`, { params, responseType: 'blob' });
  }

  exportStateStudents(
    stateName: string,
    tab: string,
    search?: string,
    source?: string,
    scholar?: boolean | null,
    duplicateOnly?: boolean | null,
    showOnlyFoc?: boolean | null,
    showOnlySbs?: boolean | null
  ): Observable<Blob> {
    let params = new HttpParams().set('tab', tab);
    if (search) params = params.set('search', search);
    if (source) params = params.set('source', source);
    if (scholar !== null && scholar !== undefined) params = params.set('scholar', scholar.toString());
    if (duplicateOnly !== null && duplicateOnly !== undefined) params = params.set('duplicateOnly', duplicateOnly.toString());
    if (showOnlyFoc !== null && showOnlyFoc !== undefined) params = params.set('showOnlyFoc', showOnlyFoc.toString());
    if (showOnlySbs !== null && showOnlySbs !== undefined) params = params.set('showOnlySbs', showOnlySbs.toString());
    return this.http.get(`${this.apiUrl}/states/${encodeURIComponent(stateName)}/students/export`, { params, responseType: 'blob' });
  }

  exportCityUsers(cityId: number, session?: string, sortBy?: string, sortDirection?: string): Observable<Blob> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    if (sortBy) params = params.set('sortBy', sortBy);
    if (sortDirection) params = params.set('sortDirection', sortDirection);
    return this.http.get(`${this.apiUrl}/cities/${cityId}/users/export`, { params, responseType: 'blob' });
  }

  exportStateUsers(stateName: string, session?: string, sortBy?: string, sortDirection?: string): Observable<Blob> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    if (sortBy) params = params.set('sortBy', sortBy);
    if (sortDirection) params = params.set('sortDirection', sortDirection);
    return this.http.get(`${this.apiUrl}/states/${encodeURIComponent(stateName)}/users/export`, { params, responseType: 'blob' });
  }

  exportCityConsultancies(cityId: number, session?: string, sortBy?: string, sortDirection?: string): Observable<Blob> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    if (sortBy) params = params.set('sortBy', sortBy);
    if (sortDirection) params = params.set('sortDirection', sortDirection);
    return this.http.get(`${this.apiUrl}/cities/${cityId}/consultancies/export`, { params, responseType: 'blob' });
  }

  exportStateConsultancies(stateName: string, session?: string, sortBy?: string, sortDirection?: string): Observable<Blob> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    if (sortBy) params = params.set('sortBy', sortBy);
    if (sortDirection) params = params.set('sortDirection', sortDirection);
    return this.http.get(`${this.apiUrl}/states/${encodeURIComponent(stateName)}/consultancies/export`, { params, responseType: 'blob' });
  }

  exportCityInstitutions(cityId: number, session?: string, sortBy?: string, sortDirection?: string): Observable<Blob> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    if (sortBy) params = params.set('sortBy', sortBy);
    if (sortDirection) params = params.set('sortDirection', sortDirection);
    return this.http.get(`${this.apiUrl}/cities/${cityId}/institutions/export`, { params, responseType: 'blob' });
  }

  exportStateInstitutions(stateName: string, session?: string, sortBy?: string, sortDirection?: string): Observable<Blob> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    if (sortBy) params = params.set('sortBy', sortBy);
    if (sortDirection) params = params.set('sortDirection', sortDirection);
    return this.http.get(`${this.apiUrl}/states/${encodeURIComponent(stateName)}/institutions/export`, { params, responseType: 'blob' });
  }

  exportCityCourses(cityId: number, session?: string, sortBy?: string, sortDirection?: string): Observable<Blob> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    if (sortBy) params = params.set('sortBy', sortBy);
    if (sortDirection) params = params.set('sortDirection', sortDirection);
    return this.http.get(`${this.apiUrl}/cities/${cityId}/courses/export`, { params, responseType: 'blob' });
  }

  exportStateCourses(stateName: string, session?: string, sortBy?: string, sortDirection?: string): Observable<Blob> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    if (sortBy) params = params.set('sortBy', sortBy);
    if (sortDirection) params = params.set('sortDirection', sortDirection);
    return this.http.get(`${this.apiUrl}/states/${encodeURIComponent(stateName)}/courses/export`, { params, responseType: 'blob' });
  }

  exportCityCourseTypes(cityId: number, session?: string): Observable<Blob> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    return this.http.get(`${this.apiUrl}/cities/${cityId}/course-types/export`, { params, responseType: 'blob' });
  }

  exportStateCourseTypes(stateName: string, session?: string): Observable<Blob> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    return this.http.get(`${this.apiUrl}/states/${encodeURIComponent(stateName)}/course-types/export`, { params, responseType: 'blob' });
  }

  exportCityLeadSources(cityId: number, session?: string): Observable<Blob> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    return this.http.get(`${this.apiUrl}/cities/${cityId}/lead-sources/export`, { params, responseType: 'blob' });
  }

  exportStateLeadSources(stateName: string, session?: string): Observable<Blob> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    return this.http.get(`${this.apiUrl}/states/${encodeURIComponent(stateName)}/lead-sources/export`, { params, responseType: 'blob' });
  }

  exportStateCities(stateName: string, session?: string, sortBy?: string, sortDirection?: string): Observable<Blob> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    if (sortBy) params = params.set('sortBy', sortBy);
    if (sortDirection) params = params.set('sortDirection', sortDirection);
    return this.http.get(`${this.apiUrl}/states/${encodeURIComponent(stateName)}/cities/export`, { params, responseType: 'blob' });
  }

  // ===================== GENDER & CASTE ANALYTICS =====================

  getTopGendersByApplications(filter?: any): Observable<LocationAnalyticsDTO[]> {
    const params = this.buildParams(filter);
    return this.http.get<any>(`${this.apiUrl}/genders/top-applications`, { params }).pipe(
      map(res => res.data || [])
    );
  }

  getTopGendersByAdmissions(filter?: any): Observable<LocationAnalyticsDTO[]> {
    const params = this.buildParams(filter);
    return this.http.get<any>(`${this.apiUrl}/genders/top-admissions`, { params }).pipe(
      map(res => res.data || [])
    );
  }

  getTopCastesByApplications(filter?: any): Observable<LocationAnalyticsDTO[]> {
    const params = this.buildParams(filter);
    return this.http.get<any>(`${this.apiUrl}/castes/top-applications`, { params }).pipe(
      map(res => res.data || [])
    );
  }

  getTopCastesByAdmissions(filter?: any): Observable<LocationAnalyticsDTO[]> {
    const params = this.buildParams(filter);
    return this.http.get<any>(`${this.apiUrl}/castes/top-admissions`, { params }).pipe(
      map(res => res.data || [])
    );
  }

  getGendersAnalytics(filter?: any): Observable<any> {
    const params = this.buildParams(filter);
    return this.http.get<any>(`${this.apiUrl}/genders`, { params }).pipe(
      map(res => res.data || {})
    );
  }

  getCastesAnalytics(filter?: any): Observable<any> {
    const params = this.buildParams(filter);
    return this.http.get<any>(`${this.apiUrl}/castes`, { params }).pipe(
      map(res => res.data || {})
    );
  }

  getGenderDetail(gender: string, session?: string): Observable<GenderDetailDTO> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    return this.http.get<any>(`${this.apiUrl}/genders/${gender}/detail`, { params }).pipe(
      map(res => res.data)
    );
  }

  getCasteDetail(casteCategory: string, session?: string): Observable<CasteDetailDTO> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    return this.http.get<any>(`${this.apiUrl}/castes/${casteCategory}/detail`, { params }).pipe(
      map(res => res.data)
    );
  }

  getGenderUserBreakdown(gender: string, page: number, size: number, sortBy: string, sortDirection: string, session?: string): Observable<PageResponse<UserBreakdown>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    if (session) params = params.set('session', session);
    return this.http.get<any>(`${this.apiUrl}/genders/${gender}/users`, { params }).pipe(
      map(res => res.data || { content: [], totalElements: 0 })
    );
  }

  getCasteUserBreakdown(casteCategory: string, page: number, size: number, sortBy: string, sortDirection: string, session?: string): Observable<PageResponse<UserBreakdown>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    if (session) params = params.set('session', session);
    return this.http.get<any>(`${this.apiUrl}/castes/${casteCategory}/users`, { params }).pipe(
      map(res => res.data || { content: [], totalElements: 0 })
    );
  }

  getGenderConsultancyBreakdown(gender: string, page: number, size: number, sortBy: string, sortDirection: string, session?: string): Observable<PageResponse<ConsultancyBreakdown>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    if (session) params = params.set('session', session);
    return this.http.get<any>(`${this.apiUrl}/genders/${gender}/consultancies`, { params }).pipe(
      map(res => res.data || { content: [], totalElements: 0 })
    );
  }

  getCasteConsultancyBreakdown(casteCategory: string, page: number, size: number, sortBy: string, sortDirection: string, session?: string): Observable<PageResponse<ConsultancyBreakdown>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    if (session) params = params.set('session', session);
    return this.http.get<any>(`${this.apiUrl}/castes/${casteCategory}/consultancies`, { params }).pipe(
      map(res => res.data || { content: [], totalElements: 0 })
    );
  }

  getGenderInstitutionBreakdown(gender: string, page: number, size: number, sortBy: string, sortDirection: string, session?: string): Observable<PageResponse<InstitutionBreakdown>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    if (session) params = params.set('session', session);
    return this.http.get<any>(`${this.apiUrl}/genders/${gender}/institutions`, { params }).pipe(
      map(res => res.data || { content: [], totalElements: 0 })
    );
  }

  getCasteInstitutionBreakdown(casteCategory: string, page: number, size: number, sortBy: string, sortDirection: string, session?: string): Observable<PageResponse<InstitutionBreakdown>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    if (session) params = params.set('session', session);
    return this.http.get<any>(`${this.apiUrl}/castes/${casteCategory}/institutions`, { params }).pipe(
      map(res => res.data || { content: [], totalElements: 0 })
    );
  }

  getGenderCourseBreakdown(gender: string, page: number, size: number, sortBy: string, sortDirection: string, session?: string): Observable<PageResponse<CourseBreakdown>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    if (session) params = params.set('session', session);
    return this.http.get<any>(`${this.apiUrl}/genders/${gender}/courses`, { params }).pipe(
      map(res => res.data || { content: [], totalElements: 0 })
    );
  }

  getCasteCourseBreakdown(casteCategory: string, page: number, size: number, sortBy: string, sortDirection: string, session?: string): Observable<PageResponse<CourseBreakdown>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    if (session) params = params.set('session', session);
    return this.http.get<any>(`${this.apiUrl}/castes/${casteCategory}/courses`, { params }).pipe(
      map(res => res.data || { content: [], totalElements: 0 })
    );
  }

  getGenderCourseTypeBreakdown(gender: string, session?: string): Observable<CourseTypeBreakdown[]> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    return this.http.get<any>(`${this.apiUrl}/genders/${gender}/course-types`, { params }).pipe(
      map(res => res.data || [])
    );
  }

  getCasteCourseTypeBreakdown(casteCategory: string, session?: string): Observable<CourseTypeBreakdown[]> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    return this.http.get<any>(`${this.apiUrl}/castes/${casteCategory}/course-types`, { params }).pipe(
      map(res => res.data || [])
    );
  }

  getGenderLeadSourceBreakdown(gender: string, session?: string): Observable<LeadSourceBreakdown[]> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    return this.http.get<any>(`${this.apiUrl}/genders/${gender}/lead-sources`, { params }).pipe(
      map(res => res.data || [])
    );
  }

  getCasteLeadSourceBreakdown(casteCategory: string, session?: string): Observable<LeadSourceBreakdown[]> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    return this.http.get<any>(`${this.apiUrl}/castes/${casteCategory}/lead-sources`, { params }).pipe(
      map(res => res.data || [])
    );
  }

  getGenderStudentsPaged(
    gender: string,
    page: number,
    size: number,
    tab: string,
    search: string,
    source: string,
    scholar: boolean | null,
    sortBy: string,
    sortDirection: string,
    duplicateOnly?: boolean | null,
    showOnlyFoc?: boolean | null,
    showOnlySbs?: boolean | null
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('tab', tab)
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    if (search) params = params.set('search', search);
    if (source) params = params.set('source', source);
    if (scholar !== null && scholar !== undefined) params = params.set('scholar', scholar.toString());
    if (duplicateOnly !== null && duplicateOnly !== undefined) params = params.set('duplicateOnly', duplicateOnly.toString());
    if (showOnlyFoc !== null && showOnlyFoc !== undefined) params = params.set('showOnlyFoc', showOnlyFoc.toString());
    if (showOnlySbs !== null && showOnlySbs !== undefined) params = params.set('showOnlySbs', showOnlySbs.toString());
    return this.http.get<any>(`${this.apiUrl}/genders/${gender}/students`, { params }).pipe(
      map(res => res.data || { content: [], totalElements: 0 })
    );
  }

  getCasteStudentsPaged(
    casteCategory: string,
    page: number,
    size: number,
    tab: string,
    search: string,
    source: string,
    scholar: boolean | null,
    sortBy: string,
    sortDirection: string,
    duplicateOnly?: boolean | null,
    showOnlyFoc?: boolean | null,
    showOnlySbs?: boolean | null
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('tab', tab)
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    if (search) params = params.set('search', search);
    if (source) params = params.set('source', source);
    if (scholar !== null && scholar !== undefined) params = params.set('scholar', scholar.toString());
    if (duplicateOnly !== null && duplicateOnly !== undefined) params = params.set('duplicateOnly', duplicateOnly.toString());
    if (showOnlyFoc !== null && showOnlyFoc !== undefined) params = params.set('showOnlyFoc', showOnlyFoc.toString());
    if (showOnlySbs !== null && showOnlySbs !== undefined) params = params.set('showOnlySbs', showOnlySbs.toString());
    return this.http.get<any>(`${this.apiUrl}/castes/${casteCategory}/students`, { params }).pipe(
      map(res => res.data || { content: [], totalElements: 0 })
    );
  }

  exportGenderStudents(
    gender: string,
    tab: string,
    search?: string,
    source?: string,
    scholar?: boolean | null,
    duplicateOnly?: boolean | null,
    showOnlyFoc?: boolean | null,
    showOnlySbs?: boolean | null
  ): Observable<Blob> {
    let params = new HttpParams().set('tab', tab);
    if (search) params = params.set('search', search);
    if (source) params = params.set('source', source);
    if (scholar !== null && scholar !== undefined) params = params.set('scholar', scholar.toString());
    if (duplicateOnly !== null && duplicateOnly !== undefined) params = params.set('duplicateOnly', duplicateOnly.toString());
    if (showOnlyFoc !== null && showOnlyFoc !== undefined) params = params.set('showOnlyFoc', showOnlyFoc.toString());
    if (showOnlySbs !== null && showOnlySbs !== undefined) params = params.set('showOnlySbs', showOnlySbs.toString());
    return this.http.get(`${this.apiUrl}/genders/${gender}/students/export`, { params, responseType: 'blob' });
  }

  exportCasteStudents(
    casteCategory: string,
    tab: string,
    search?: string,
    source?: string,
    scholar?: boolean | null,
    duplicateOnly?: boolean | null,
    showOnlyFoc?: boolean | null,
    showOnlySbs?: boolean | null
  ): Observable<Blob> {
    let params = new HttpParams().set('tab', tab);
    if (search) params = params.set('search', search);
    if (source) params = params.set('source', source);
    if (scholar !== null && scholar !== undefined) params = params.set('scholar', scholar.toString());
    if (duplicateOnly !== null && duplicateOnly !== undefined) params = params.set('duplicateOnly', duplicateOnly.toString());
    if (showOnlyFoc !== null && showOnlyFoc !== undefined) params = params.set('showOnlyFoc', showOnlyFoc.toString());
    if (showOnlySbs !== null && showOnlySbs !== undefined) params = params.set('showOnlySbs', showOnlySbs.toString());
    return this.http.get(`${this.apiUrl}/castes/${casteCategory}/students/export`, { params, responseType: 'blob' });
  }

  exportGenderUsers(gender: string, session?: string, sortBy?: string, sortDirection?: string): Observable<Blob> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    if (sortBy) params = params.set('sortBy', sortBy);
    if (sortDirection) params = params.set('sortDirection', sortDirection);
    return this.http.get(`${this.apiUrl}/genders/${gender}/users/export`, { params, responseType: 'blob' });
  }

  exportCasteUsers(casteCategory: string, session?: string, sortBy?: string, sortDirection?: string): Observable<Blob> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    if (sortBy) params = params.set('sortBy', sortBy);
    if (sortDirection) params = params.set('sortDirection', sortDirection);
    return this.http.get(`${this.apiUrl}/castes/${casteCategory}/users/export`, { params, responseType: 'blob' });
  }

  exportGenderConsultancies(gender: string, session?: string, sortBy?: string, sortDirection?: string): Observable<Blob> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    if (sortBy) params = params.set('sortBy', sortBy);
    if (sortDirection) params = params.set('sortDirection', sortDirection);
    return this.http.get(`${this.apiUrl}/genders/${gender}/consultancies/export`, { params, responseType: 'blob' });
  }

  exportCasteConsultancies(casteCategory: string, session?: string, sortBy?: string, sortDirection?: string): Observable<Blob> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    if (sortBy) params = params.set('sortBy', sortBy);
    if (sortDirection) params = params.set('sortDirection', sortDirection);
    return this.http.get(`${this.apiUrl}/castes/${casteCategory}/consultancies/export`, { params, responseType: 'blob' });
  }

  exportGenderInstitutions(gender: string, session?: string, sortBy?: string, sortDirection?: string): Observable<Blob> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    if (sortBy) params = params.set('sortBy', sortBy);
    if (sortDirection) params = params.set('sortDirection', sortDirection);
    return this.http.get(`${this.apiUrl}/genders/${gender}/institutions/export`, { params, responseType: 'blob' });
  }

  exportCasteInstitutions(casteCategory: string, session?: string, sortBy?: string, sortDirection?: string): Observable<Blob> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    if (sortBy) params = params.set('sortBy', sortBy);
    if (sortDirection) params = params.set('sortDirection', sortDirection);
    return this.http.get(`${this.apiUrl}/castes/${casteCategory}/institutions/export`, { params, responseType: 'blob' });
  }

  exportGenderCourses(gender: string, session?: string, sortBy?: string, sortDirection?: string): Observable<Blob> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    if (sortBy) params = params.set('sortBy', sortBy);
    if (sortDirection) params = params.set('sortDirection', sortDirection);
    return this.http.get(`${this.apiUrl}/genders/${gender}/courses/export`, { params, responseType: 'blob' });
  }

  exportCasteCourses(casteCategory: string, session?: string, sortBy?: string, sortDirection?: string): Observable<Blob> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    if (sortBy) params = params.set('sortBy', sortBy);
    if (sortDirection) params = params.set('sortDirection', sortDirection);
    return this.http.get(`${this.apiUrl}/castes/${casteCategory}/courses/export`, { params, responseType: 'blob' });
  }

  exportGenderCourseTypes(gender: string, session?: string): Observable<Blob> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    return this.http.get(`${this.apiUrl}/genders/${gender}/course-types/export`, { params, responseType: 'blob' });
  }

  exportCasteCourseTypes(casteCategory: string, session?: string): Observable<Blob> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    return this.http.get(`${this.apiUrl}/castes/${casteCategory}/course-types/export`, { params, responseType: 'blob' });
  }

  exportGenderLeadSources(gender: string, session?: string): Observable<Blob> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    return this.http.get(`${this.apiUrl}/genders/${gender}/lead-sources/export`, { params, responseType: 'blob' });
  }

  exportCasteLeadSources(casteCategory: string, session?: string): Observable<Blob> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    return this.http.get(`${this.apiUrl}/castes/${casteCategory}/lead-sources/export`, { params, responseType: 'blob' });
  }
}
