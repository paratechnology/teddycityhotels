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
    const icons = ['twitter', 'facebook', 'linkedin', 'apple', 'linux', 'windows', 'google-play'];
    icons.forEach(name =>
      iconRegistry.addSvgIcon(name, sanitizer.bypassSecurityTrustResourceUrl(`assets/icons/${name}.svg`))
    );
  };
}


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimationsAsync(),
     {
      provide: APP_INITIALIZER,
      useFactory: registerIcons,
      deps: [MatIconRegistry, DomSanitizer], // Inject the registry and sanitizer
      multi: true,
    },
  ]
};
