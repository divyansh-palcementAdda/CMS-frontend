import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, filter, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes('/auth/')) {
        console.warn('[AuthInterceptor] 401 Unauthorized detected for URL:', req.url);
        const currentToken = auth.getToken();
        const requestToken = req.headers.get('Authorization')?.replace('Bearer ', '');

        if (currentToken && requestToken && currentToken !== requestToken) {
          console.log('[AuthInterceptor] Token already refreshed by concurrent request. Replaying request with new token.');
          const retried = req.clone({ setHeaders: { Authorization: `Bearer ${currentToken}` } });
          return next(retried);
        }

        const refreshToken = auth.getRefreshToken();
        if (!refreshToken) {
          console.error('[AuthInterceptor] No refresh token found. Triggering logout.');
          auth.logoutWithExpiredMessage();
          return throwError(() => err);
        }

        if (!auth.getIsRefreshing()) {
          console.log('[AuthInterceptor] Starting token refresh flow.');
          auth.setIsRefreshing(true);
          auth.setRefreshTokenSubject(null);

          return auth.refreshToken().pipe(
            switchMap(() => {
              console.log('[AuthInterceptor] Token refresh successful.');
              auth.setIsRefreshing(false);
              const newToken = auth.getToken();
              auth.setRefreshTokenSubject(newToken);

              console.log('[AuthInterceptor] Replaying original request with new token.');
              const retried = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
              return next(retried);
            }),
            catchError((refreshErr) => {
              console.error('[AuthInterceptor] Token refresh failed. Triggering logout.', refreshErr);
              auth.setIsRefreshing(false);
              auth.setRefreshTokenSubject(null);
              auth.logoutWithExpiredMessage();
              return throwError(() => refreshErr);
            })
          );
        } else {
          console.log('[AuthInterceptor] Token refresh already in progress. Queuing this request.');
          return auth.getRefreshTokenSubject().pipe(
            filter(t => t !== null),
            take(1),
            switchMap((newToken) => {
              console.log('[AuthInterceptor] Queue released. Replaying queued request with new token.');
              const retried = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
              return next(retried);
            })
          );
        }
      }
      return throwError(() => err);
    })
  );
};
