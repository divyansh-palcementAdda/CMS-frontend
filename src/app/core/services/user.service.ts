import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { UserPageData, UserItem, UserStats, UserRole, CreateUserDTO, BulkUserUploadResponse,
         MyProfileDTO, UpdateProfileRequest, ChangePasswordRequest, EmailChangeRequest, EmailVerifyRequest } from '../models/user.model';

import { DatePipe } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/user`;

  constructor(private http: HttpClient, private datePipe: DatePipe) { }

  getUsersData(): Observable<UserPageData> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => {
        const users = Array.isArray(response) ? response : (response?.data || []);
        const mappedUsers: UserItem[] = users.map((u: any, i: number) => this.mapUserItem(u, i));

        const stats: UserStats = {
          totalUsers: mappedUsers.length,
          activeUsers: mappedUsers.filter((u: UserItem) => u.status === 'Active').length,
          inactiveUsers: mappedUsers.filter((u: UserItem) => u.status === 'Inactive').length,
          adminUsers: mappedUsers.filter((u: UserItem) => (u.role || '').toUpperCase().includes('ADMIN')).length
        };

        return { stats, users: mappedUsers, totalCount: mappedUsers.length };
      })
    );
  }

  getUsersByStatus(status: string): Observable<UserPageData> {
    return this.http.get<any>(`${this.apiUrl}/status/${status.toUpperCase()}`).pipe(
      map(response => {
        const users = Array.isArray(response) ? response : (response?.data || []);
        const mappedUsers: UserItem[] = users.map((u: any, i: number) => this.mapUserItem(u, i));

        const stats: UserStats = {
          totalUsers: mappedUsers.length,
          activeUsers: mappedUsers.filter((u: UserItem) => u.status === 'Active').length,
          inactiveUsers: mappedUsers.filter((u: UserItem) => u.status === 'Inactive').length,
          adminUsers: mappedUsers.filter((u: UserItem) => (u.role || '').toUpperCase().includes('ADMIN')).length
        };

        return { stats, users: mappedUsers, totalCount: mappedUsers.length };
      })
    );
  }

  getUserById(id: number): Observable<UserItem> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        const userData = response.data || response;
        if (!userData) throw new Error('User not found');
        return this.mapUserItem(userData);
      })
    );
  }

  getUserDetail(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/detail`).pipe(
      map(res => {
        const data = res.data || res;
        if (data.basicInfo) {
          data.basicInfo = this.mapUserItem(data.basicInfo);
        }
        return data;
      })
    );
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  updateUser(id: number | string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  toggleStatus(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  private mapUserItem(u: any, index?: number): UserItem {
    const status = (typeof u.status === 'string' && u.status.toUpperCase() === 'ACTIVE') || u.isActive ? 'Active' : 'Inactive';

    let roles: UserRole[] = [];
    let roleName = 'User';

    if (Array.isArray(u.roles) && u.roles.length > 0) {
      roles = u.roles.map((r: any, i: number) => {
        let rName = 'User';
        if (typeof r === 'string') {
          rName = r;
        } else if (r && typeof r === 'object') {
          // Handle various possible backend names
          rName = r.name || r.roleName || r.displayName || 'User';
        }

        return {
          roleId: r.roleId || i + 1,
          name: rName.replace('ROLE_', '').replace(/_/g, ' '),
          rawName: rName
        };
      });
      roleName = roles.map(r => r.name).join(', ');
    }

    return {
      id: u.userId || u.id,
      sNo: index !== undefined ? index + 1 : undefined,
      username: u.username || '',
      fullName: u.fullName || u.username || 'N/A',
      email: u.email || '',
      mobile: u.mobile || '',
      role: roleName,
      roles: roles,
      status: status as 'Active' | 'Inactive',
      emailVerified: !!u.emailVerified,
      createdAt: this.formatDate(u.createdAt, u.createdAt || ''),
      updatedAt: this.formatDate(u.updatedAt, u.updatedAt || ''),
      consultancies: (u.consultancies || []).map((c: any) => ({
        id: c.id || c.consultancyId,
        name: c.name || c.consultancyName || 'N/A',
        email: c.email || 'N/A',
        duration: c.duration || 'N/A',
        students: c.studentCount || 0,
        status: c.status || 'Active',
        institutionName: c.institutionName || 'N/A',
        mobile: c.mobile || c.alternateNo || 'N/A',
        city: c.city || 'N/A',
        commissionPercentage: c.commissionPercentage || 'N/A',
      })),
      admissionStats: u.admissionStats,
      totalAdmissions: u.admissionStats?.activeAdmissions || 0,
      totalApplications: u.admissionStats?.admissionInAllCourses || 0,
      remainingApplications: u.admissionStats?.activeApplications || 0,
      cancelledAdmissions: u.admissionStats?.cancelledAdmissions || 0,
      cancelledApplications: u.admissionStats?.cancelledApplications || 0,
      formsLast3Days: u.formsLast3Days || 0,
      formsLast7Days: u.formsLast7Days || 0
    };
  }

  formatDate(date: string | null, fallback: string): string {
    if (!date) return fallback;
    try {
      return this.datePipe.transform(date, 'MMM d, y, h:mm a') || fallback;
    } catch {
      return fallback;
    }
  }

  getUsersPaged(
    page: number,
    size: number,
    search: string = '',
    role: string = '',
    status: string = '',
    sortBy: string = 'name',
    sortDirection: string = 'asc'
  ): Observable<{ content: UserItem[], totalElements: number, totalPages: number, stats: UserStats }> {
    let params = `?page=${page}&size=${size}&sortBy=${sortBy}&sortDirection=${sortDirection}`;
    if (search) params += `&search=${encodeURIComponent(search)}`;
    if (role)   params += `&role=${encodeURIComponent(role)}`;
    if (status) params += `&status=${encodeURIComponent(status)}`;

    return this.http.get<any>(`${this.apiUrl}/paged${params}`).pipe(
      map(res => {
        const pagedData = res.data || res;
        const rawContent = pagedData.content || [];
        const content = rawContent.map((u: any, i: number) => this.mapUserItem(u, page * size + i));

        // Parse real stats returned by the optimized backend query
        const backendStats = pagedData.stats || {};
        const stats: UserStats = {
          totalUsers:    backendStats.totalUsers    ?? pagedData.totalElements ?? 0,
          activeUsers:   backendStats.activeUsers   ?? 0,
          inactiveUsers: backendStats.inactiveUsers ?? 0,
          adminUsers:    backendStats.adminUsers    ?? 0
        };

        return {
          content,
          totalElements: pagedData.totalElements || 0,
          totalPages:    pagedData.totalPages    || 0,
          stats
        };
      })
    );
  }

  createUser(user: CreateUserDTO): Observable<UserItem> {
    return this.http.post<UserItem>(this.apiUrl, user);
  }

  bulkUpload(file: File): Observable<BulkUserUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<BulkUserUploadResponse>(`${this.apiUrl}/bulk-upload`, formData);
  }

  downloadTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/template`, { responseType: 'blob' });
  }

  sendOtp(email: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/send-otp?email=${email}`, {});
  }

  verifyOtp(email: string, otp: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/verify-otp?email=${email}&otp=${otp}`, {});
  }

  getAllRoles(): Observable<any[]> {
    return this.http.get<any>(`${environment.apiUrl}/roles`).pipe(
      map(response => response.data || [])
    );
  }

  exportUserStudents(userId: number, tabName: string, search: string, source: string, scholar: boolean | null): Observable<Blob> {
    let params: any = { tab: tabName };
    if (search) params.search = search;
    if (source) params.source = source;
    if (scholar !== null) params.scholar = scholar;

    return this.http.get(`${this.apiUrl}/${userId}/export-excel`, {
      params,
      responseType: 'blob'
    });
  }

  // ─── My Profile APIs ──────────────────────────────────────────────────────────

  /** Fetch the currently-authenticated user's full profile */
  getMyProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me`);
  }

  /**
   * Update only fullName and mobile.
   * NEVER sends email, role, or status — those are intentionally excluded.
   */
  updateMyProfile(data: UpdateProfileRequest): Observable<any> {
    const safePayload: UpdateProfileRequest = {
      fullName: data.fullName,
      mobile: data.mobile
    };
    return this.http.put<any>(`${this.apiUrl}/me`, safePayload);
  }

  /** Change password — requires current password for verification */
  changeMyPassword(data: ChangePasswordRequest): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/me/change-password`, data);
  }

  /**
   * Step 1 of email change: request OTP to new email.
   * Does NOT update the email immediately — triggers verification flow.
   */
  requestEmailChange(data: EmailChangeRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/me/request-email-change`, data);
  }

  /** Step 2: verify OTP and complete email change */
  verifyEmailChange(data: EmailVerifyRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/me/verify-email-change`, data);
  }

  /** Resend OTP to pendingEmail (rate-limited server-side) */
  resendEmailOtp(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/me/resend-email-otp`, {});
  }

  /** Fetch active devices */
  getMyDevices(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me/devices`);
  }

  /** Fetch historical login activities */
  getMyLoginActivities(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me/login-activities`);
  }

  /** Logout a specific device */
  logoutDevice(deviceId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/me/devices/${deviceId}`);
  }

  /** Logout all devices */
  logoutAllDevicesApi(): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/me/devices`);
  }
}

