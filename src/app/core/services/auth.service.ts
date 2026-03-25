import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, User, JwtPayload } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'authToken';
  private readonly REFRESH_KEY = 'refreshToken';
  private readonly USER_KEY = 'user';

  private _user = signal<User | null>(null);

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly isAdmin = computed(() => this.hasRole('ROLE_ADMIN'));

  constructor(private http: HttpClient, private router: Router) {
    this.restoreSession();
  }

  private restoreSession(): void {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      const userStr = localStorage.getItem(this.USER_KEY);
      if (token && userStr) {
        const payload = this.decodeToken(token);
        if (payload && payload.exp * 1000 > Date.now()) {
          this._user.set({ ...JSON.parse(userStr), token });
        } else {
          this.clearStorage();
        }
      }
    } catch {
      this.clearStorage();
    }
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, request).pipe(
      tap((res) => {
        if (res.success && res.data) {
          const { accessToken, refreshToken, id, username, email, roles } = res.data;
          const user: User = { id, username, email, roles, token: accessToken };
          localStorage.setItem(this.TOKEN_KEY, accessToken);
          localStorage.setItem(this.REFRESH_KEY, refreshToken);
          localStorage.setItem(this.USER_KEY, JSON.stringify(user));
          this._user.set(user);
        }
      }),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Login failed')))
    );
  }

  logout(): void {
    this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe({ error: () => {} });
    this.clearStorage();
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  refreshToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<any>(`${environment.apiUrl}/auth/refresh`, { refreshToken }).pipe(
      tap((res) => {
        if (res.data?.accessToken) {
          localStorage.setItem(this.TOKEN_KEY, res.data.accessToken);
          const current = this._user();
          if (current) this._user.set({ ...current, token: res.data.accessToken });
        }
      })
    );
  }

  hasRole(role: string): boolean {
    const roles = this._user()?.roles ?? [];
    const normalized = role.startsWith('ROLE_') ? role : `ROLE_${role}`;
    return roles.some(r => (r.startsWith('ROLE_') ? r : `ROLE_${r}`) === normalized);
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(r => this.hasRole(r));
  }

  private decodeToken(token: string): JwtPayload | null {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  private clearStorage(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
}
