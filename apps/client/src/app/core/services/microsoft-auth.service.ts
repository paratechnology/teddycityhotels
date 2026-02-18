// Create new file at: apps/client/src/app/core/services/microsoft-auth.service.ts
import { Injectable, inject } from '@angular/core';
import { PublicClientApplication, AuthenticationResult, InteractionType, PopupRequest, RedirectRequest, BrowserAuthError } from '@azure/msal-browser';
import { from, Observable, ReplaySubject, of, throwError, switchMap, catchError } from 'rxjs';
import { environment } from 'apps/client/src/environments/environment';


// --- Microsoft Graph API Scopes ---
export const graphScopes = {
  scopes: ['User.Read', 'Files.ReadWrite.All']
};
@Injectable({
  providedIn: 'root'
})
export class MicrosoftAuthService {
  // Configuration is now created inside the service to make the multi-tenant authority clear.
  public msalInstance: PublicClientApplication = new PublicClientApplication({
    auth: {
      clientId: environment.msalConfig.auth.clientId, // Your app's Client ID from Azure
      authority: environment.msalConfig.auth.authority, // Use 'common' for multi-tenant + personal accounts
      redirectUri: environment.msalConfig.auth.redirectUri, // This will be different for dev, prod, and mobile
    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: false,
    },
  });


  // This subject will emit `true` once MSAL has been initialized.
  public initialized: Promise<void>;

  constructor() {
    // The initialize() method returns a promise that we can await elsewhere.
    this.initialized = this.msalInstance.initialize();
  }

  login(options?: { prompt: 'select_account' | 'login' | 'consent' }): Observable<AuthenticationResult> {
    const request = {
      ...graphScopes,
      prompt: options?.prompt // Allow specific prompts, but login itself will often trigger consent if needed
    };

        // console.log(this.msalInstance, 'req:', request);

    // Using popup for a better SPA experience, can be changed to redirect
    return from(this.msalInstance.loginPopup(request));
  }

  loginRedirect(request: RedirectRequest): Observable<void> {
    // Use this for flows that require a full page redirect. MSAL handles PKCE automatically.
    return from(this.msalInstance.loginRedirect(request));
  }

  logout(): Observable<void> {
    // We use logoutPopup to keep the user in the app.
    // It clears the tokens for all accounts.
    return from(this.msalInstance.logoutPopup());
  }

  acquireToken(): Observable<AuthenticationResult> {
    // We don't need to await here because any action requiring a token will happen
    // after the initial silent login has already ensured initialization is complete.
    const account = this.msalInstance.getAllAccounts()[0];
    if (!account) {
      return throwError(() => new Error('User not logged in. Cannot acquire token.'));
    }
    const request = { ...graphScopes, account };

    return from(this.msalInstance.acquireTokenSilent(request)).pipe(
      catchError(error => {
        // If silent acquisition fails because interaction is required (e.g., consent),
        // fall back to an interactive request.
        if (error instanceof BrowserAuthError && error.errorCode.includes('interaction_required')) {
          console.warn('Silent token acquisition failed, interaction required. Falling back to popup.');
          return from(this.msalInstance.acquireTokenPopup(request));
        }
        return throwError(() => error); // Re-throw other errors
      })
    );
  }

  /**
   * Checks for a cached user session and attempts to silently log them in.
   * This method now assumes that `initialize()` has already been awaited.
   */
  async checkAndSilentLogin(): Promise<AuthenticationResult | null> {
    const account = this.msalInstance.getAllAccounts()[0];
    if (!account) {
      // No cached account, so no one to log in.
      return null;
    }
    const request = { ...graphScopes, account };
    // Attempt to get a token silently. If this succeeds, the user has a valid session.
    return this.msalInstance.acquireTokenSilent(request);
  }
}
