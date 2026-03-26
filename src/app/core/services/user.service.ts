import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { UserPageData, UserItem, UserStats, UserRole } from '../models/user.model';
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
        const users = Array.isArray(response) ? response : (response?.data || response?.content || (response ? [response] : []));

        let totalUsers = users.length;
        let activeUsers = 0;
        let inactiveUsers = 0;
        let adminUsers = 0;

        const mappedUsers: UserItem[] = users.map((u: any, index: number) => {
          const status = (typeof u.status === 'string' && u.status.toUpperCase() === 'ACTIVE') || u.isActive ? 'Active' : 'Inactive';

          let roleName = 'Student';
          let isAdmin = false;

          if (Array.isArray(u.roles) && u.roles.length > 0) {
            roleName = u.roles.map((r: any) => {
              const rName = typeof r === 'string' ? r : (r.name || '');
              const formatted = rName.replace('ROLE_', '').replace(/_/g, ' ').toLowerCase();
              return formatted.charAt(0).toUpperCase() + formatted.slice(1);
            }).join(', ');
            isAdmin = u.roles.some((r: any) => {
              const rName = typeof r === 'string' ? r : (r.name || '');
              return rName.toUpperCase().includes('ADMIN');
            });
          }

          if (status === 'Active') activeUsers++;
          else inactiveUsers++;

          if (isAdmin) adminUsers++;

          return {
            id: u.userId || u.id,
            sNo: index + 1,
            username: u.username || '',
            fullName: u.fullName || u.username || 'Unknown',
            email: u.email || '',
            role: roleName,
            roles: [], // summary not needed for list
            status: status as 'Active' | 'Inactive',
            emailVerified: !!u.emailVerified,
            createdAt: u.createdAt || '',
            updatedAt: u.updatedAt || ''
          };
        });

        const stats: UserStats = {
          totalUsers,
          activeUsers,
          inactiveUsers,
          adminUsers
        };

        return { stats, users: mappedUsers, totalCount: totalUsers };
      }),
      catchError(err => {
        console.warn('Failed to load user data, using mock fallback', err);
        return of(this.getMockData());
      })
    );
  }

  getUserById(id: number): Observable<UserItem> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(u => {
        const userData = u.data || u;
        const status = (typeof userData.status === 'string' && userData.status.toUpperCase() === 'ACTIVE') || userData.isActive ? 'Active' : 'Inactive';

        let roles: UserRole[] = [];
        if (Array.isArray(userData.roles)) {
          roles = userData.roles.map((r: any, index: number) => {
            const rName = typeof r === 'string' ? r : (r.name || 'User');
            let formattedName = rName.replace('ROLE_', '').replace(/_/g, ' ').toLowerCase();
            formattedName = formattedName.split(' ')
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');

            return {
              roleId: r.roleId || index + 1,
              name: formattedName
            };
          });
        }

        return {
          id: userData.userId || userData.id,
          username: userData.username || '',
          fullName: userData.fullName || userData.username || 'Unknown',
          email: userData.email || '',
          mobile: userData.mobile || '',
          status: status as 'Active' | 'Inactive',
          emailVerified: !!userData.emailVerified,
          createdAt: this.formatDate(userData.createdAt, 'Jan 5, 2025'),
          updatedAt: this.formatDate(userData.updatedAt, 'Mar 10, 2026'),
          roles: roles,
          consultancies: (userData.consultancies || []).map((c: any) => ({
            id: c.id || c.consultancyId,
            name: c.name || c.consultancyName || 'Elite Education Consultancy',
            email: c.email || 'contact@elite_education.com',
            duration: c.duration || '4 yrs',
            students: c.studentCount || 0,
            status: c.status || 'Active',
            institutionName: c.institutionName || 'MIT'
          })),
          admissionStats: userData.admissionStats || {
            directAdmissions: 0,
            viaConsultancy: 0,
            totalAdmissions: 0
          },
          // Maintain compatibility with existing UI if it uses these fields directly
          directAdmissions: userData.admissionStats?.directAdmissions || 0,
          viaConsultancy: userData.admissionStats?.viaConsultancy || 0,
          totalAdmissions: userData.admissionStats?.totalAdmissions || 0,
          courseMode: 'Online',
          courseFees: '₹485,000'
        };
      }),
      catchError(err => {
        console.warn(`Failed to load user with id ${id}, using mock fallback`, err);
        return of(this.getMockDetail(id));
      })
    );
  }
  formatDate(date: string | null, fallback: string): string {
    if (!date) return fallback;

    const formatted = this.datePipe.transform(
      date.substring(0, 23),
      'MMM d, y, h:mm a'
    );

    return formatted || fallback;
  }

  private getMockDetail(id: number): UserItem {
    return {
      id: id,
      username: 'Johnsmith_15',
      fullName: 'John Smith',
      email: 'johnsmith@gmail.com',
      mobile: '+91 9054378923',
      status: 'Active',
      emailVerified: true,
      createdAt: 'Jan 5, 2025',
      updatedAt: 'Mar 10, 2026',
      roles: [
        { roleId: 1, name: 'Super Admin' },
        { roleId: 2, name: 'Sub Admin' }
      ],
      directAdmissions: 8,
      viaConsultancy: 12,
      totalAdmissions: 20,
      consultancies: [
        {
          id: 1,
          name: 'Elite Education Consultancy',
          email: 'contact@elite_education.com',
          duration: '4 yrs',
          students: 245,
          status: 'Active',
          institutionName: 'MIT'
        }
      ]
    };
  }

  private getMockData(): UserPageData {
    const mockUsers: any[] = [
      { id: 1, sNo: 1, fullName: 'Courtney Henry', email: 'deanna.curtis@example.com', role: 'Super Admin', status: 'Active', roles: [], emailVerified: true, createdAt: '', updatedAt: '', username: 'courtney' },
      { id: 2, sNo: 2, fullName: 'Theresa Webb', email: 'michael.mitc@example.com', role: 'Admin', status: 'Active', roles: [], emailVerified: true, createdAt: '', updatedAt: '', username: 'theresa' },
      { id: 3, sNo: 3, fullName: 'Darrell Steward', email: 'curtis.weaver@example.com', role: 'Finance', status: 'Inactive', roles: [], emailVerified: false, createdAt: '', updatedAt: '', username: 'darrell' },
      { id: 4, sNo: 4, fullName: 'Arlene McCoy', email: 'debbie.baker@example.com', role: 'Faculty', status: 'Active', roles: [], emailVerified: true, createdAt: '', updatedAt: '', username: 'arlene' },
      { id: 5, sNo: 5, fullName: 'Kathryn Murphy', email: 'sara.cruz@example.com', role: 'Consultant', status: 'Active', roles: [], emailVerified: true, createdAt: '', updatedAt: '', username: 'kathryn' },
      { id: 6, sNo: 6, fullName: 'Jerome Bell', email: 'georgia.young@example.com', role: 'Student', status: 'Active', roles: [], emailVerified: true, createdAt: '', updatedAt: '', username: 'jerome' },
      { id: 7, sNo: 7, fullName: 'Ronald Richards', email: 'jessica.hanson@example.com', role: 'Support', status: 'Active', roles: [], emailVerified: true, createdAt: '', updatedAt: '', username: 'ronald' },
      { id: 8, sNo: 8, fullName: 'Albert Flores', email: 'felicia.reid@example.com', role: 'Student', status: 'Inactive', roles: [], emailVerified: false, createdAt: '', updatedAt: '', username: 'albert' },
      { id: 9, sNo: 9, fullName: 'Dianne Russell', email: 'alma.lawson@example.com', role: 'Finance', status: 'Active', roles: [], emailVerified: true, createdAt: '', updatedAt: '', username: 'dianne' },
      { id: 10, sNo: 10, fullName: 'Esther Howard', email: 'tim.jennings@example.com', role: 'Consultant', status: 'Active', roles: [], emailVerified: true, createdAt: '', updatedAt: '', username: 'esther' }
    ];

    return {
      stats: {
        totalUsers: 9,
        activeUsers: 8,
        inactiveUsers: 11,
        adminUsers: 1479
      },
      users: mockUsers as UserItem[],
      totalCount: 1200
    };
  }
}
