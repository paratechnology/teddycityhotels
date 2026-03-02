import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminSessionService } from '../core/admin-session.service';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const session = inject(AdminSessionService);

  if (!session.token) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};
