import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { UserPageData, UserItem, UserStats, UserRole, CreateUserDTO, BulkUserUploadResponse } from '../models/user.model';
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

        let activeCount = 0;
        let adminCount = 0;

        const mappedUsers: UserItem[] = users.map((u: any, index: number) => {
          const status = (typeof u.status === 'string' && u.status.toUpperCase() === 'ACTIVE') || u.isActive ? 'Active' : 'Inactive';
          if (status === 'Active') activeCount++;

          let roleName = 'User';
          let isAdmin = false;

          if (Array.isArray(u.roles) && u.roles.length > 0) {
            roleName = u.roles.map((r: any) => {
              const rName = typeof r === 'string' ? r : (r.name || '');
              return rName.replace('ROLE_', '').replace(/_/g, ' ');
            }).join(', ');
            isAdmin = u.roles.some((r: any) => {
              const rName = typeof r === 'string' ? r : (r.name || '');
              return rName.toUpperCase().includes('ADMIN');
            });
          }

          if (isAdmin) adminCount++;

          return {
            id: u.userId || u.id,
            sNo: index + 1,
            username: u.username || '',
            fullName: u.fullName || u.username || 'N/A',
            email: u.email || '',
            role: roleName,
            status: status as 'Active' | 'Inactive',
            emailVerified: !!u.emailVerified,
            createdAt: u.createdAt || '',
            updatedAt: u.updatedAt || ''
          };
        });

        const stats: UserStats = {
          totalUsers: mappedUsers.length,
          activeUsers: activeCount,
          inactiveUsers: mappedUsers.length - activeCount,
          adminUsers: adminCount
        };

        return { stats, users: mappedUsers, totalCount: mappedUsers.length };
      })
    );
  }

  getUsersByStatus(status: string): Observable<UserPageData> {
    return this.http.get<any>(`${this.apiUrl}/status/${status.toUpperCase()}`).pipe(
      map(response => {
        const users = Array.isArray(response) ? response : (response?.data || []);

        let activeCount = 0;
        let adminCount = 0;

        const mappedUsers: UserItem[] = users.map((u: any, index: number) => {
          const uStatus = (typeof u.status === 'string' && u.status.toUpperCase() === 'ACTIVE') || u.isActive ? 'Active' : 'Inactive';
          if (uStatus === 'Active') activeCount++;

          let roleName = 'User';
          let isAdmin = false;

          if (Array.isArray(u.roles) && u.roles.length > 0) {
            roleName = u.roles.map((r: any) => {
              const rName = typeof r === 'string' ? r : (r.name || '');
              return rName.replace('ROLE_', '').replace(/_/g, ' ');
            }).join(', ');
            isAdmin = u.roles.some((r: any) => {
              const rName = typeof r === 'string' ? r : (r.name || '');
              return rName.toUpperCase().includes('ADMIN');
            });
          }

          if (isAdmin) adminCount++;

          return {
            id: u.userId || u.id,
            sNo: index + 1,
            username: u.username || '',
            fullName: u.fullName || u.username || 'N/A',
            email: u.email || '',
            role: roleName,
            status: uStatus as 'Active' | 'Inactive',
            emailVerified: !!u.emailVerified,
            createdAt: u.createdAt || '',
            updatedAt: u.updatedAt || ''
          };
        });

        const stats: UserStats = {
          totalUsers: mappedUsers.length,
          activeUsers: activeCount,
          inactiveUsers: mappedUsers.length - activeCount,
          adminUsers: adminCount
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

        const status = (typeof userData.status === 'string' && userData.status.toUpperCase() === 'ACTIVE') || userData.isActive ? 'Active' : 'Inactive';

        let roles: UserRole[] = [];
        if (Array.isArray(userData.roles)) {
          roles = userData.roles.map((r: any, index: number) => {
            const rName = typeof r === 'string' ? r : (r.name || 'User');
            return {
              roleId: r.roleId || index + 1,
              name: rName.replace('ROLE_', '').replace(/_/g, ' ')
            };
          });
        }

        return {
          id: userData.userId || userData.id,
          username: userData.username || '',
          fullName: userData.fullName || userData.username || 'N/A',
          email: userData.email || '',
          mobile: userData.mobile || '',
          status: status as 'Active' | 'Inactive',
          emailVerified: !!userData.emailVerified,
          createdAt: this.formatDate(userData.createdAt, 'N/A'),
          updatedAt: this.formatDate(userData.updatedAt, 'N/A'),
          roles: roles,
          consultancies: (userData.consultancies || []).map((c: any) => ({
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
          admissionStats: userData.admissionStats || {
            directAdmissions: 0,
            viaConsultancy: 0,
            totalAdmissions: 0
          },
          directAdmissions: userData.admissionStats?.directAdmissions || 0,
          viaConsultancy: userData.admissionStats?.viaConsultancy || 0,
          totalAdmissions: userData.admissionStats?.totalAdmissions || 0
        };
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

  formatDate(date: string | null, fallback: string): string {
    if (!date) return fallback;
    try {
      return this.datePipe.transform(date, 'MMM d, y, h:mm a') || fallback;
    } catch {
      return fallback;
    }
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
    return this.http.get(`${this.apiUrl}/bulk-upload/template`, { responseType: 'blob' });
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
}
