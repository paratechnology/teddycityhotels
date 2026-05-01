import { ResolveFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of, tap } from 'rxjs';
import { IProperty } from '@teddy-city-hotels/shared-interfaces';
import { PropertyService } from './property.service';
import { PropertyContextService } from './property-context.service';

/**
 * Resolves the active property for any route under `/hotels/:slug`. On
 * success the property is pushed into PropertyContextService so child pages
 * can read it without prop drilling. On failure (unknown slug, network) the
 * user is redirected to the properties index.
 */
export const propertyResolver: ResolveFn<IProperty | null> = (route) => {
  const slug = route.paramMap.get('slug');
  const propertyService = inject(PropertyService);
  const context = inject(PropertyContextService);
  const router = inject(Router);

  if (!slug) {
    router.navigate(['/hotels']);
    return of(null);
  }

  return propertyService.getBySlug(slug).pipe(
    tap((property) => context.setActive(property)),
    map((property) => property),
    catchError(() => {
      context.setActive(null);
      router.navigate(['/hotels']);
      return of(null);
    })
  );
};
