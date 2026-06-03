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
        const currentToken = auth.getToken();
        const requestToken = req.headers.get('Authorization')?.replace('Bearer ', '');

        if (currentToken && requestToken && currentToken !== requestToken) {
          // A token refresh has already occurred! Retry immediately with the new token.
          const retried = req.clone({ setHeaders: { Authorization: `Bearer ${currentToken}` } });
          return next(retried);
        }

        if (!auth.getIsRefreshing()) {
          auth.setIsRefreshing(true);
          auth.setRefreshTokenSubject(null);

          return auth.refreshToken().pipe(
            switchMap(() => {
              auth.setIsRefreshing(false);
              const newToken = auth.getToken();
              auth.setRefreshTokenSubject(newToken);

              const retried = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
              return next(retried);
            }),
            catchError((refreshErr) => {
              auth.setIsRefreshing(false);
              auth.setRefreshTokenSubject(null);
              auth.logoutWithExpiredMessage();
              return throwError(() => refreshErr);
            })
          );
        } else {
          return auth.getRefreshTokenSubject().pipe(
            filter(t => t !== null),
            take(1),
            switchMap((newToken) => {
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
