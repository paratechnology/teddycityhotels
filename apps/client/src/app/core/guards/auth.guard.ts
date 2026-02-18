import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export const authGuard: CanActivateFn = (route, state): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUserProfile$.pipe(
    take(1),
    map(currentUser => {
      if (currentUser) {
        return true;
      }
      return router.createUrlTree(['/login']);
    })
  );
};

