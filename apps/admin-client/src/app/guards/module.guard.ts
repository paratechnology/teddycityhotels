import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminModuleKey } from '@teddy-city-hotels/shared-interfaces';
import { AdminSessionService } from '../core/admin-session.service';

export const moduleGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const session = inject(AdminSessionService);

  const moduleKey = route.data?.['module'] as AdminModuleKey | undefined;

  if (!moduleKey) {
    return true;
  }

  if (!session.hasModuleAccess(moduleKey)) {
    router.navigate(['/forbidden']);
    return false;
  }

  return true;
};
