import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, User, JwtPayload } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'authToken';
  private readonly REFRESH_KEY = 'refreshToken';
  private readonly USER_KEY = 'user';

  private _user = signal<User | null>(null);

  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  getIsRefreshing(): boolean {
    return this.isRefreshing;
  }

  setIsRefreshing(val: boolean): void {
    this.isRefreshing = val;
  }

  getRefreshTokenSubject(): BehaviorSubject<string | null> {
    return this.refreshTokenSubject;
  }

  setRefreshTokenSubject(val: string | null): void {
    this.refreshTokenSubject.next(val);
  }

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly isAdmin = computed(() => this.hasRole('ROLE_ADMIN'));

  constructor(private http: HttpClient, private router: Router) {
    this.restoreSession();
  }

  private restoreSession(): void {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      const refreshToken = localStorage.getItem(this.REFRESH_KEY);
      const userStr = localStorage.getItem(this.USER_KEY);
      if (token && refreshToken && userStr) {
        console.log('[AuthService] Restoring session. Token present. Expired status:', this.isTokenExpired(token));
        this._user.set({ ...JSON.parse(userStr), token });
      } else {
        console.log('[AuthService] Cannot restore session: missing tokens or user profile from localStorage.');
        this.clearStorage();
      }
    } catch (e) {
      console.error('[AuthService] Error restoring session:', e);
      this.clearStorage();
    }
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) return true;
    return payload.exp * 1000 <= Date.now();
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    console.log('[AuthService] login called for identifier:', request.emailOrUsername);
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, request).pipe(
      tap((res) => {
        if (res.success && res.data) {
          const { accessToken, refreshToken, id, username, email, roles } = res.data;
          const user: User = { id, username, email, roles, token: accessToken };
          localStorage.setItem(this.TOKEN_KEY, accessToken);
          localStorage.setItem(this.REFRESH_KEY, refreshToken);
          localStorage.setItem(this.USER_KEY, JSON.stringify(user));
          this._user.set(user);
          console.log('[AuthService] login success. Stored tokens and user profile.');
        }
      }),
      catchError((err) => {
        console.error('[AuthService] login error:', err);
        return throwError(() => new Error(err.error?.message || 'Login failed'));
      })
    );
  }

  logout(): void {
    console.log('[AuthService] logout triggered. Revoking current refresh token.');
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.http.post(`${environment.apiUrl}/auth/logout`, { refreshToken }).subscribe({
        next: () => console.log('[AuthService] Backend logout successful'),
        error: (err) => console.error('[AuthService] Backend logout error', err)
      });
    }
    this.clearStorage();
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  logoutAllDevices(): void {
    console.log('[AuthService] logoutAllDevices triggered. Revoking all active sessions globally.');
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.http.post(`${environment.apiUrl}/auth/logout-all`, { refreshToken }).subscribe({
        next: () => console.log('[AuthService] Backend global logout successful'),
        error: (err) => console.error('[AuthService] Backend global logout error', err)
      });
    }
    this.clearStorage();
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  logoutWithExpiredMessage(): void {
    console.warn('[AuthService] Session expired or invalid. Logging out and redirecting to Login page.');
    this.clearStorage();
    this._user.set(null);
    this.router.navigate(['/login'], { queryParams: { expired: 'true' } });
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  refreshToken(): Observable<any> {
    console.log('[AuthService] refresh called.');
    const refreshToken = this.getRefreshToken();
    return this.http.post<any>(`${environment.apiUrl}/auth/refresh`, { refreshToken }).pipe(
      tap((res) => {
        if (res.data?.accessToken) {
          console.log('[AuthService] refresh success. Access token updated.');
          localStorage.setItem(this.TOKEN_KEY, res.data.accessToken);
          const current = this._user();
          if (current) this._user.set({ ...current, token: res.data.accessToken });
        }
      }),
      catchError((err) => {
        console.error('[AuthService] refresh API error:', err);
        return throwError(() => err);
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
