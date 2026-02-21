import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from '@angular/fire/firestore';
import { INotification, baseURL } from '@teddy-city-hotels/shared-interfaces';
import { filter, switchMap, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private notificationsUrl = `${baseURL}notifications`;

  public notifications = signal<INotification[]>([]);
  public unreadCount = computed(() => this.notifications().filter(n => !n.read).length);
  
  constructor() {
    // Listen for user profile changes to start/stop listening for notifications
    this.authService.currentUserProfile$.pipe(
      tap(() => {
        // Clear notifications on logout
        this.notifications.set([]);
      }),
      filter(user => !!user), // Only proceed if user is logged in
      switchMap(user => {
        const q = query(
          collection(this.firestore, `firms/${user!.firmId}/users/${user!.id}/notifications`),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        // Wrap onSnapshot in a new Observable to make it compatible with RxJS
        return new Observable(subscriber => {
          const unsubscribe = onSnapshot(q, (snapshot) => {
            subscriber.next(snapshot);
          }, (error) => {
            subscriber.error(error);
          });
          return () => unsubscribe(); // This will be called on unsubscription
        });
      })
    ).subscribe((snapshot: any) => {
      const notifications = snapshot.docs.map((doc: any) => doc.data() as INotification);
      this.notifications.set(notifications);
      // unreadCount is now a computed signal, so it updates automatically.
    });
  }

  async markAsRead(notification: INotification): Promise<void> {
    if (notification.read) return;

    // Optimistically update the UI for a snappy feel.
    // The real-time listener will correct this if the backend call fails.
    this.notifications.update(current =>
      current.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );

    // Send the request to the backend API to perform the actual update.
    this.http.post(`${this.notificationsUrl}/${notification.id}/read`, {}).subscribe({
      // We don't need to do anything on success because the real-time listener will get the update.
      // If an error occurs, the real-time listener will eventually sync back to the unread state.
    });
  }
}
