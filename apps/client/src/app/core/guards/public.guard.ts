// publicGuard
import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';
import { Observable } from 'rxjs';

export const publicGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return authService.currentUserProfile$.pipe(
    take(1),
    map(currentUser => {
      if (currentUser) {
        return router.createUrlTree(['/app/dashboard']);
      }
      return true;
    })
  );
};
