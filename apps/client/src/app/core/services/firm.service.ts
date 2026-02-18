import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IFirm, IFirmUser, baseURL } from '@quickprolaw/shared-interfaces';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';


@Injectable({
  providedIn: 'root'
})
export class FirmService {
  private http = inject(HttpClient);
  private firmUrl = `${baseURL}firm/`;
  public authService = inject(AuthService);

  // --- State Management for Firm Profile ---
  private state = signal<{ profile: IFirm | null, loading: boolean, error: string | null }>({
    profile: null,
    loading: false,
    error: null,
  });

  public firmProfile = signal<IFirm | null>(null);

  getUsers(): Observable<IFirmUser[]> {
    return this.http.get<IFirmUser[]>(`${this.firmUrl}users`);
  }

  getProfile(): Observable<IFirm> {
    // If profile is already loaded, return it from state to avoid extra API calls
    // if (this.firmProfile()) {
      // return of(this.firmProfile()!);
    // }
    return this.http.get<IFirm>(`${this.firmUrl}profile`).pipe(
      tap(profile => this.firmProfile.set(profile))
    );
  }

  
  updateProfile(data: Partial<IFirm>): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.firmUrl}profile`, data);
  }

  completeMicrosoftAuth(code: string, redirectUri: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.firmUrl}profile/complete-ms-auth`, { code, redirectUri });
  }

  removeMicrosoftIntegration(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.firmUrl}profile/microsoft-integration`).pipe(
      tap(() => {
        // Clear the local state immediately
        this.firmProfile.update(profile => {
          if (profile) {
            return { ...profile, microsoftIntegration: undefined };
          }
          return null;
        });
      })
    );
  }

  // This now points to the secure backend endpoint for admin updates.
  public updateFirmUserProfile(userId: string, data: Partial<IFirmUser>): Observable<IFirmUser> {
    return this.http.put<IFirmUser>(`${this.firmUrl}firm-user/${userId}`, data);
  }

  deleteFirm(): Observable<void> {
    return this.http.delete<void>(`${this.firmUrl}profile`);
  }

}