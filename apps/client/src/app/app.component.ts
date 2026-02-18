import { Component, inject, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet, LoadingController, ToastController } from '@ionic/angular/standalone';
import { PushNotificationService } from './core/services/push-notification.service';
import { AppUpdateService } from './core/services/app-update.service';
import { AuthService } from './core/services/auth.service';
import { MicrosoftAuthService } from './core/services/microsoft-auth.service';
import { AuthenticationResult } from '@azure/msal-browser';
import { FirmService } from './core/services/firm.service';
import { UserService } from './core/services/user.service';
import { finalize, first } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { ScreenOrientation } from '@capacitor/screen-orientation';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  private pushService = inject(PushNotificationService);
  private microsoftAuthService = inject(MicrosoftAuthService);
  private firmService = inject(FirmService);
  private userService = inject(UserService);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private router = inject(Router);

  constructor(private updater: AppUpdateService) { }



  async ngOnInit() {
    try {
      await ScreenOrientation.lock({ orientation: 'portrait' });
    } catch (error) {
      // This might fail in a browser if not in full-screen PWA mode, which is fine.
      console.warn('Screen orientation lock failed or not supported:', error);
    }

    
    // This is now the central handler for all MSAL redirects.
    // CRITICAL: We must wait for MSAL to initialize before calling any of its APIs.
    await this.microsoftAuthService.msalInstance.initialize();

    // First, check for our manual redirect which uses query params.
    const manualRedirectHandled = await this.processManualRedirect();

    // If not a manual redirect, let MSAL check for its own redirects (future-proofing).
    if (!manualRedirectHandled) {
      this.microsoftAuthService.msalInstance.handleRedirectPromise().then(this.handleMsalRedirect.bind(this));
    }

    // Initialize push notifications after a user has successfully logged in.
    this.authService.currentUserProfile$.subscribe(user => {
      if (user) {
        // User has logged in
        this.pushService.initPush();
      }
    });

    // Check for native app updates on startup.
    await this.updater.checkForUpdates();
  }

  private async processManualRedirect(): Promise<boolean> {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (code && state) {
      // Clear the query parameters from the URL to prevent re-processing on refresh.
      this.router.navigate([], {
        relativeTo: this.router.routerState.root,
        queryParams: {},
        replaceUrl: true
      });

      // Manually construct the result object and call the handler.
      const manualResult: Partial<AuthenticationResult> = { code, state };
      this.handleMsalRedirect(manualResult as AuthenticationResult);
      return true; // Indicate that we handled a redirect.
    }
    return false; // No manual redirect found.
  }

  private async handleMsalRedirect(result: AuthenticationResult | null) {
    if (!result || !result.code || !result.state) {
      return; // Not a redirect we need to handle.
    }


    try {
      // Ensure the main user profile is loaded before proceeding.
      await firstValueFrom(this.authService.currentUserProfile$.pipe(first(user => !!user)));

      const { code, state } = result;
      const redirectUri = this.microsoftAuthService.msalInstance.getConfiguration().auth.redirectUri!;

      const loading = await this.loadingCtrl.create({ message: 'Finalizing connection...' });
      await loading.present();

      if (state === 'microsoft_integration_setup') {
        // --- FIRM-WIDE INTEGRATION FLOW ---
        this.firmService.completeMicrosoftAuth(code, redirectUri).pipe(
          finalize(() => loading.dismiss())
        ).subscribe({
          next: async (res) => {
            // Explicitly refresh the firm profile state after successful integration.
            await firstValueFrom(this.firmService.getProfile());
            await this.toastCtrl.create({ message: 'Firm-wide Microsoft 365 integration successful!', duration: 3000, color: 'success' }).then(t => t.present());
            this.router.navigate(['/app/firm/settings']); // Navigate to the correct settings page
          },
          error: async (err) => this.showErrorToast(err, 'Failed to complete firm integration.')
        });

      } else if (state === 'personal_signature_setup') {
        // --- PERSONAL SIGNATURE INTEGRATION FLOW ---
        this.userService.connectPersonalMicrosoftAccount(code, redirectUri).pipe(
          finalize(() => loading.dismiss())
        ).subscribe({
          next: async (res) => {

            // Explicitly re-fetch the profile to update the UI with the new connection status.
            // By forcing a token refresh, we trigger the stream in AuthService to re-fetch the profile
            // from the backend, which now includes the new connection data.
            await this.authService.firebaseUser()?.getIdToken(true);
            await this.toastCtrl.create({ message: 'Personal Microsoft account connected successfully!', duration: 3000, color: 'success' }).then(t => t.present());
            this.router.navigate(['/app/profile']); // Stay on the profile page
          },
          error: async (err) => this.showErrorToast(err, 'Failed to connect personal account.')
        });

      } else {
        // Unrecognized state, dismiss loading and do nothing.
        await loading.dismiss();
      }
    } catch (error) {
      console.error("Could not process MSAL redirect:", error);
      this.showErrorToast(error, 'An unexpected error occurred.');
    }
  }

  private async showErrorToast(error: any, defaultMessage: string) {
    const message = error?.error?.message || defaultMessage;
    await this.toastCtrl.create({ message, duration: 5000, color: 'danger' }).then(t => t.present());
  }


}
