import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { baseURL } from '@quickprolaw/shared-interfaces';
import { AuthService } from '../services/auth.service';

const EXCLUDED_DOMAINS = [
  'firebaseio.com',
  'googleapis.com'
];

/**
 * Intercepts outgoing HTTP requests to attach the Firebase ID token
 * as a bearer token for all authenticated API calls.
 */
export const bearerTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  // ✅ POINT to the new firebaseUser signal
  const firebaseUser = authService.firebaseUser(); 

  const isBackendRequest = req.url.startsWith(baseURL);
  const isExcludedDomain = EXCLUDED_DOMAINS.some(domain => req.url.includes(domain));

  // ✅ The condition now correctly checks for the firebaseUser object
  if (isBackendRequest && !isExcludedDomain && firebaseUser) {
    // Now firebaseUser is guaranteed to be a Firebase User object with .getIdToken()
    return from(firebaseUser.getIdToken()).pipe(
      switchMap(token => {
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        return next(authReq);
      })
    );
  }

  return next(req);
};