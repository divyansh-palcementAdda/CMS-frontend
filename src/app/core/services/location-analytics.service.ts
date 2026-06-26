import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LocationAnalyticsDTO } from '../models/location-analytics.model';

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
}
