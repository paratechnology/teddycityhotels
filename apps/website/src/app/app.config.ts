import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { DomSanitizer } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatIconRegistry } from '@angular/material/icon';


/**
 * Factory function to register custom SVG icons.
 * This function runs once when the app starts.
 */
export function registerIcons(iconRegistry: MatIconRegistry, sanitizer: DomSanitizer): () => void {
  return () => {
    // Register the social icons you uploaded (from src/assets/icons/)
    // The name 'twitter' is linked to the asset file
    iconRegistry.addSvgIcon(
      'twitter',
      sanitizer.bypassSecurityTrustResourceUrl('assets/icons/twitter.svg')
    );
    iconRegistry.addSvgIcon(
      'facebook',
      sanitizer.bypassSecurityTrustResourceUrl('assets/icons/facebook.svg')
    );
    iconRegistry.addSvgIcon(
      'linkedin',
      sanitizer.bypassSecurityTrustResourceUrl('assets/icons/linkedin.svg')
    );
      iconRegistry.addSvgIcon(
      'apple',
      sanitizer.bypassSecurityTrustResourceUrl('assets/icons/apple.svg')
    );
    iconRegistry.addSvgIcon(
      'linux',
      sanitizer.bypassSecurityTrustResourceUrl('assets/icons/linux.svg')
    );
    iconRegistry.addSvgIcon(
      'windows',
      sanitizer.bypassSecurityTrustResourceUrl('assets/icons/windows.svg')
    );
        iconRegistry.addSvgIcon(
      'google-play',
      sanitizer.bypassSecurityTrustResourceUrl('assets/icons/google-play.svg')
    );
    // NOTE: We will need to add more icons here (apple, google-play, etc.)
    // once you upload their SVG files.
  };
}


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptorsFromDi()),
    provideRouter(routes), provideAnimationsAsync(),
     {
      provide: APP_INITIALIZER,
      useFactory: registerIcons,
      deps: [MatIconRegistry, DomSanitizer], // Inject the registry and sanitizer
      multi: true,
    },
  ]
};
