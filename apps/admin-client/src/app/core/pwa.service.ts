import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PwaService {
  private initialized = false;

  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/admin-sw.js').catch(() => {
      // PWA setup should never block app boot.
    });
  }
}
