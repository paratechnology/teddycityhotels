import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import {
  PushNotifications,
  Token,
  PushNotificationSchema,
  ActionPerformed,
  PermissionStatus,
} from '@capacitor/push-notifications';
import { HttpClient } from '@angular/common/http';
import { baseURL } from '@quickprolaw/shared-interfaces';
import { ToastController } from '@ionic/angular/standalone';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private authService = inject(AuthService);

  private notificationsUrl = `${baseURL}notifications`;

  public initPush() {
    if (Capacitor.getPlatform() !== 'web') {
      this.registerPush();
    }
  }

  private registerPush() {
    PushNotifications.addListener('registration', (token: Token) => {
      // The client's only job is to send its token and firmId to the server.
      // The server will handle the topic subscription.
      const user = this.authService.userProfile();
      if (user && user.firmId) {
        const payload = { token: token.value, firmId: user.firmId };
        this.http.post(`${this.notificationsUrl}/register-token`, payload).subscribe();
      }
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    PushNotifications.addListener(
      'pushNotificationReceived',
      async (notification: PushNotificationSchema) => {
        const toast = await this.toastCtrl.create({
          header: notification.title,
          message: notification.body,
          duration: 5000,
          position: 'top',
          buttons: [
            {
              text: 'View',
              handler: () => {
                if (notification.data.link) {
                  this.router.navigateByUrl(notification.data.link);
                }
              }
            }
          ]
        });
        await toast.present();
      }
    );

    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification: ActionPerformed) => {
        if (notification.notification.data.link) {
          this.router.navigateByUrl(notification.notification.data.link);
        }
      }
    );

    PushNotifications.checkPermissions().then((status: PermissionStatus) => {
      if (status.receive === 'prompt') {
        PushNotifications.requestPermissions().then((result: PermissionStatus) => {
          if (result.receive === 'granted') {
            PushNotifications.register();
          }
        });
      } else if (status.receive === 'granted') {
        PushNotifications.register();
      }
    });
  }
}