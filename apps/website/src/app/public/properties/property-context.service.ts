import { Injectable } from '@angular/core';
import { IProperty } from '@teddy-city-hotels/shared-interfaces';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Tracks the property currently being viewed on the public website so
 * property-scoped pages (rooms, snooker, swimming, kitchen, etc.) can read
 * it without prop drilling through the route tree.
 */
@Injectable({
  providedIn: 'root'
})
export class PropertyContextService {
  private readonly _active$ = new BehaviorSubject<IProperty | null>(null);

  setActive(property: IProperty | null): void {
    this._active$.next(property);
  }

  get active$(): Observable<IProperty | null> {
    return this._active$.asObservable();
  }

  get current(): IProperty | null {
    return this._active$.getValue();
  }
}
