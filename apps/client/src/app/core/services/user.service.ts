import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { IFirmUser, IinventoryItem, baseURL } from '@quickprolaw/shared-interfaces';
import { firstValueFrom, Observable, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private usersUrl = `${baseURL}users/`;
  // CORRECT: Inject AuthService as a class property, not inside a method.
  private authService = inject(AuthService);

  // Helper to get current value from AuthService safely
  currentUser() {
    return this.authService.userProfile();
  }

  getMyProfile(): Observable<IFirmUser> {
    return this.http.get<IFirmUser>(`${this.usersUrl}me`);
  }

  getFirmUsers(): Observable<IFirmUser[]> {
    return this.http.get<IFirmUser[]>(`${this.usersUrl}firm`);
  }

  getMyPossessions(): Observable<IinventoryItem[]> {
    return this.http.get<IinventoryItem[]>(`${this.usersUrl}me/possessions`);
  }



  uploadProfilePicture(file: File): Observable<IFirmUser> {
    const user = this.authService.userProfile(); // Use the injected service

    if (!user) {
      return throwError(() => new Error('User not authenticated.'));
    }

    // Step 1: Get a signed URL from our backend
    return this.http.post<{ uploadUrl: string, publicUrl: string }>(`${baseURL}users/profile-picture-url`, {
      contentType: file.type
    }).pipe(
      switchMap(response => {
        // Step 2: Upload the file directly to Google Cloud Storage using the signed URL
        return this.http.put(response.uploadUrl, file, { headers: { 'Content-Type': file.type } }).pipe(
          // Step 3: Once uploaded, update the user's profile with the public URL
          switchMap(() => {
            return this.authService.updateProfile({ picture: response.publicUrl });
          })
        );
      })
    );
  }

  uploadSignature(file: File): Observable<any> {
    // Step 1: Get a signature upload session URL from our backend
    return this.http.post<{ uploadUrl: string }>(`${baseURL}users/signature/upload`, {}).pipe(
      switchMap(response => {
        // Step 2: Upload the file directly to Microsoft OneDrive using the session URL.
        // For a single-chunk upload, we need to provide Content-Range.
        // The response from this PUT contains the created DriveItem resource.
        return this.http.put<any>(response.uploadUrl, file, {
          headers: {
            'Content-Range': `bytes 0-${file.size - 1}/${file.size}`
          }
        });
      }),
      switchMap(driveItem => {
        // Step 3: Send the created drive item ID to our backend to finalize and get a preview URL
        if (!driveItem || !driveItem.id) {
          return throwError(() => new Error('Could not get drive item ID from upload response.'));
        }
        return this.http.post<{ message: string }>(`${baseURL}users/signature/finalize`, { itemId: driveItem.id });
      })
    );
  }

  removeSignature(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${baseURL}users/signature`);
  }

  removePersonalMicrosoftAccount(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${baseURL}users/signature/integration`);
  }

  connectPersonalMicrosoftAccount(code: string, redirectUri: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${baseURL}users/signature/connect`, { code, redirectUri });
  }

  getSignatureImage(): Observable<Blob> {
    // Add a timestamp to bust the browser cache and ensure we get the latest signature
    return this.http.get(`${baseURL}users/me/signature?t=${Date.now()}`, { responseType: 'blob' });
  }

  updateUserStatus(userId: string, active: boolean): Observable<any> {
    return this.http.patch(`${this.usersUrl}${userId}/status`, { active });
  }


  // updateRole(userId: string, role: UserRole): Observable<IFirmUser> {
  //   return this.http.patch<IFirmUser>(`${this.usersUrl}${userId}/role`, { role });
  // }


  /**
   * Marks a tour as completed in Firestore so it doesn't show again.
   */
  async markTourAsSeen(tourId: string): Promise<void> {
    const user = this.currentUser();
    if (!user || !user.id) return;

    // Optimistic check
    const currentTours = user.seenTours || [];
    if (currentTours.includes(tourId)) return;

    // Optimistically update local state so the UI never replays the tour in this session.
    this.authService.userProfile.set({ ...user, seenTours: [...currentTours, tourId] });

    try {
      const updatedUser = await firstValueFrom(
        this.http.post<IFirmUser>(`${this.usersUrl}me/seen-tours`, { tourId })
      );
      this.authService.userProfile.set(updatedUser);
    } catch (error) {
      console.error('Failed to save tour progress', error);
    }
  }
}
