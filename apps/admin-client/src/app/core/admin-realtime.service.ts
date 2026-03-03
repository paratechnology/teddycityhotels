import { Injectable } from '@angular/core';
import { interval, of, Subscription } from 'rxjs';
import { catchError, startWith, switchMap } from 'rxjs/operators';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, Messaging, onMessage } from 'firebase/messaging';
import { IAdminNotification, PaginatedResponse } from '@teddy-city-hotels/shared-interfaces';
import { AdminNotificationService } from '../services/admin-notification.service';
import { InAppAlertService } from './in-app-alert.service';
import {
  ADMIN_FIREBASE_VAPID_KEY,
  ADMIN_FIREBASE_WEB_CONFIG,
  isFirebasePushConfigured,
} from './firebase-web-push.config';

@Injectable({ providedIn: 'root' })
export class AdminRealtimeService {
  private pollingSub?: Subscription;
  private started = false;
  private readonly seenStorageKey = 'admin_seen_notifications';
  private readonly tokenStorageKey = 'fcmToken';
  private readonly seen = new Set<string>(this.readSeen());
  private messaging?: Messaging;

  constructor(
    private notificationsService: AdminNotificationService,
    private alerts: InAppAlertService
  ) {}

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;

    await this.registerServiceWorkerAndPush();
    this.startPolling();
  }

  stop(): void {
    this.started = false;
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
      this.pollingSub = undefined;
    }
  }

  private async registerServiceWorkerAndPush(): Promise<void> {
    if (!('serviceWorker' in navigator)) return;

    let registration: ServiceWorkerRegistration | null = null;
    try {
      registration = await navigator.serviceWorker.register('/admin-sw.js');
    } catch {
      registration = null;
    }

    if (!registration || !isFirebasePushConfigured()) return;
    if (!(await isSupported())) return;

    try {
      const app = initializeApp(ADMIN_FIREBASE_WEB_CONFIG, 'admin-client-push');
      this.messaging = getMessaging(app);

      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      const token = await getToken(this.messaging, {
        vapidKey: ADMIN_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        const oldToken = localStorage.getItem(this.tokenStorageKey);
        if (oldToken !== token) {
          localStorage.setItem(this.tokenStorageKey, token);
        }

        this.notificationsService.registerToken(token).pipe(catchError(() => of({ message: '' }))).subscribe();
      }

      onMessage(this.messaging, (payload) => {
        const title = payload.notification?.title || 'Notification';
        const body = payload.notification?.body || 'You have a new update.';
        const link = payload.data?.['link'] || '/notifications';

        this.alerts.show({ title, message: body, link });
      });
    } catch {
      // Push setup is non-blocking.
    }
  }

  private startPolling(): void {
    this.pollingSub = interval(20000)
      .pipe(
        startWith(0),
        switchMap(() =>
          this.notificationsService
            .list({ page: 1, pageSize: 20 })
            .pipe(catchError(() => of<PaginatedResponse<IAdminNotification> | IAdminNotification[]>([])))
        )
      )
      .subscribe((result) => {
        const rows = Array.isArray(result) ? result : result.data;
        this.handleRows(rows);
      });
  }

  private handleRows(rows: IAdminNotification[]): void {
    for (const row of rows) {
      if (row.read || this.seen.has(row.id)) continue;

      this.seen.add(row.id);
      this.persistSeen();

      this.alerts.show({
        title: row.title,
        message: row.body,
        link: row.link || '/notifications',
      });
    }
  }

  private readSeen(): string[] {
    const raw = localStorage.getItem(this.seenStorageKey);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as string[];
      return Array.isArray(parsed) ? parsed.slice(0, 200) : [];
    } catch {
      return [];
    }
  }

  private persistSeen(): void {
    localStorage.setItem(this.seenStorageKey, JSON.stringify(Array.from(this.seen).slice(-200)));
  }
}
