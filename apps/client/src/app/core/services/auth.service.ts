import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal, runInInjectionContext, Injector, computed } from '@angular/core';
import { Router } from '@angular/router';
import { IFirmUser, baseURL, IAuthResponse, IAcceptInvitation, IRegisterFirm } from '@quickprolaw/shared-interfaces';

import { Observable, of, from, EMPTY, throwError } from 'rxjs';
import { map, switchMap, tap, shareReplay, catchError, finalize } from 'rxjs/operators';
import { AuthenticationResult } from '@azure/msal-browser';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Auth, signInWithEmailAndPassword, authState, User, signInWithCustomToken, getIdTokenResult, applyActionCode } from '@angular/fire/auth';
import { ILoginSchemaType } from '@quickprolaw/shared-interfaces';
import { MicrosoftAuthService } from './microsoft-auth.service'; // <-- Import



const AUTH_DATA = 'auth_data';
const PENDING_REG_DATA = 'pending_reg_data';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private auth = inject(Auth);
  private injector = inject(Injector);
  private microsoftAuthService = inject(MicrosoftAuthService); // <-- Inject

  public userProfile = signal<IFirmUser | null>(null);
  public firebaseUser = signal<User | null>(null);

  private microsoftAuthResult = signal<AuthenticationResult | null>(null);
  public isAuthenticatedWithMicrosoft = computed(() => !!this.microsoftAuthResult());


  public setMicrosoftAuth(result: AuthenticationResult|null) {
    this.microsoftAuthResult.set(result);
  }

  public getMicrosoftAuthDetails(): AuthenticationResult | null {
    return this.microsoftAuthResult();
  }


  
  /**
   * An observable stream that manages the entire authentication state.
   * It listens for Firebase auth changes, gets the firmId from the token claims,
   * then fetches the full user profile from the correct Firestore path.
   */
  public currentUserProfile$: Observable<IFirmUser | null> = authState(this.auth).pipe(
    switchMap(user => {
      if (!user) {
        // User is logged out, clear everything.
        this.clearStoredUser();
        // Navigate to login page only AFTER auth state is confirmed null.
        this.router.navigate(['/login']);
        return of(null);
      }
      // User is logged in. Perform the backend handshake to get the authoritative user profile.
      // This is the single source of truth for the user's session data.
      return from(user.getIdToken(true)).pipe(
        switchMap(idToken => {
          return this.http.post<IAuthResponse>(`${baseURL}auth/login`, { idToken });
        }),
        map(response => {
          if (response.success && response.user) {
            // The backend has validated the user and returned the full profile.
            // Check if profile is incomplete AND we are not in an auth callback flow.
            const isAuthCallback = this.router.url.includes('/auth-callback');
            // if (!response.user.picture && !isAuthCallback) {
            //   this.router.navigate(['/app/profile'], { queryParams: { firstTime: 'true' } });
            // }
            return response.user;
          }
          // If the backend handshake fails for any reason, treat it as a failed login.
          console.error('Backend handshake failed during auth state change.');
          // IMPORTANT: Instead of calling logout() directly, which causes a race condition
          // with authState, we return an error that will be caught by the outer catchError.
          // This ensures the stream emits a `null` value before completing.
          throw new Error('Backend handshake failed');
        })
      );
    }),
    // 5. Finally, set the userProfile signal with the data from Firestore.
    tap(userProfile => {
      this.firebaseUser.set(this.auth.currentUser); // Keep firebaseUser signal in sync
      this.userProfile.set(userProfile);
      if (userProfile) {
        this.storeUser(userProfile);
      }
    }),
    catchError((err) => {
      console.error('Auth state stream error, logging out:', err);
      // Perform the logout as a side-effect here, but ensure we emit `null`
      // to allow downstream operators to complete gracefully.
      this.logout().catch(e => console.error('Error during logout in catchError', e));
      return of(null);
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor() {
    // We subscribe here to kickstart the stream and ensure auth state is always monitored.
    this.currentUserProfile$.subscribe({
      error: (err) => { console.error('Auth state stream subscription error:', err); }
    });

    // Correctly handle silent Microsoft login on app startup.
    this.handleSilentMicrosoftLogin();
  }

  private async storeUser(user: IFirmUser) {
    // This method is required by the currentUserProfile$ stream.
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key: AUTH_DATA, value: JSON.stringify(user) });
    }
  }

  private async clearStoredUser() {
    this.userProfile.set(null); // Ensure signal is cleared
    if (Capacitor.isNativePlatform()) {
      await Preferences.remove({ key: AUTH_DATA });
    }
  }

  /**
   * Checks for a cached Microsoft session on app startup and silently logs the user in.
   * This is the key to persistent login.
   */
  private async handleSilentMicrosoftLogin() {
    try {
      // 1. Await for MSAL to be fully initialized.
      await this.microsoftAuthService.initialized;
      // 2. Now it's safe to check for a cached session.
      const result = await this.microsoftAuthService.checkAndSilentLogin();
      if (result) {
        // A cached session was found and a token was acquired silently.
        this.setMicrosoftAuth(result);
      }
    } catch (err) {
      // This is not a critical error. It just means the user needs to log in manually.
      console.warn('Silent MSAL login failed. User will need to sign in manually.', err);
    }
  }


  public login(dto: ILoginSchemaType): Observable<User> {
    // The only job of the login method is to authenticate with Firebase.
    // The `currentUserProfile$` stream will automatically handle the subsequent
    // backend handshake and profile fetching.
    // We use runInInjectionContext to avoid Zone.js warnings from AngularFire.
    return from(runInInjectionContext(this.injector, () =>
      signInWithEmailAndPassword(this.auth, dto.email, dto.password)
    )).pipe(
      map(userCredential => userCredential.user),
    );
  }

  public async logout() {
    await this.auth.signOut();
  }

  public acceptInvitation(dto: IAcceptInvitation): Observable<any> {
    // Step 1: Call the backend to register the user.
    return this.http.post<IAuthResponse>(`${baseURL}/auth/accept-invitation`, dto).pipe(
      switchMap(response => {
        // Step 2: Use the custom token from the backend to sign in to Firebase.
        return from(signInWithCustomToken(this.auth, response.token));
      })
    );
  }

  public initiateRegistration(dto: IRegisterFirm): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${baseURL}auth/initiate-registration`, dto);
  }

  public resendVerificationEmail(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${baseURL}auth/resend-verification`, { email });
  }

  public applyActionCode(code: string): Observable<void> {
    return from(applyActionCode(this.auth, code));
  }

  public setPendingRegistration(dto: IRegisterFirm): void {
    sessionStorage.setItem(PENDING_REG_DATA, JSON.stringify(dto));
  }

  public getPendingRegistration(): IRegisterFirm | null {
    const pendingDataString = sessionStorage.getItem(PENDING_REG_DATA);
    if (!pendingDataString) {
      return null;
    }
    // We don't remove it here, it gets removed on final completion.
    return JSON.parse(pendingDataString);
  }

  public completeFirmRegistration(options: { subscriptionType: 'trial' | 'paid' }): Observable<any> {
    const pendingDataString = sessionStorage.getItem(PENDING_REG_DATA);
    if (!pendingDataString) {
      return throwError(() => new Error('No pending registration data found. Please start over.'));
    }
    const dto: IRegisterFirm = JSON.parse(pendingDataString);

    // Add subscription choice to the DTO
    const payload = { ...dto, ...options };

    return this.http.post<IAuthResponse>(`${baseURL}auth/register-firm`, payload).pipe(
      switchMap(response => {
        if (response.success && response.token) {
          sessionStorage.removeItem(PENDING_REG_DATA);
          return from(signInWithCustomToken(this.auth, response.token));
        }
        return throwError(() => new Error('Registration failed.'));
      })
    );
  }

  public requestPasswordReset(email: string): Observable<{ message: string }> {
    const endpoint = `${baseURL}auth/request-password-reset`;
    return this.http.post<{ message: string }>(endpoint, { email });
  }

  public resetPasswordWithCode(payload: { email: string, code: string, newPassword: string }): Observable<{ message: string }> {
    const endpoint = `${baseURL}auth/reset-password`;
    return this.http.post<{ message: string }>(endpoint, payload);
  }

  public updateProfile(data: Partial<IFirmUser>): Observable<IFirmUser> {
    // This now calls a secure backend endpoint for updating the logged-in user's own profile.
    return this.http.put<IFirmUser>(`${baseURL}auth/my-profile`, data).pipe(
      tap(updatedUser => {
        // After a successful update, update the local signal to reflect the changes instantly.
        this.userProfile.set(updatedUser);
      })
    );

    
  }

}