import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { MatterService } from '../services/matter.service';

export function uniqueMatterValidator(
  matterService: MatterService, 
  field: 'suitNo' | 'fileNo',
  ignoreValue?: string
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value || control.value === ignoreValue) {
      return of(null);
    }

    return timer(500).pipe(
      switchMap(() => matterService.checkUniqueness(field, control.value)),
      map((response: { unique: boolean, existingTitle?: string }) => {
        // If unique is false, return the error object WITH the title
        return response.unique 
          ? null 
          : { notUnique: { existingTitle: response.existingTitle } };
      }),
      catchError(() => of(null)) // On error, assume valid to avoid blocking user
    );
  };
}