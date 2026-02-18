import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.userProfile();

  const isAdmin = user?.admin || user?.isSuperAdmin;

  if (isAdmin) {
    return true;
  } else {
    // Redirect non-admin users to the tasks page
    return router.parseUrl('/tasks');
  }
};