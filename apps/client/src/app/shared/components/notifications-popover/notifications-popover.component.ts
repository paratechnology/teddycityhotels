import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonList, IonItem, IonLabel, IonNote, IonIcon, IonButton, PopoverController, ToastController } from '@ionic/angular/standalone';
import { INotification, NotificationType } from '@quickprolaw/shared-interfaces';
import { NotificationService } from '../../../core/services/notification.service';
import { addIcons } from 'ionicons';
import { checkmarkOutline, closeCircleOutline } from 'ionicons/icons';
import { FileLogService } from '../../../core/services/file-log.service';

@Component({
  selector: 'app-notifications-popover',
  template: `
    <ion-list>
      @for (notif of notificationService.notifications(); track notif.id) {
        <ion-item button [detail]="false" (click)="onNotificationClick(notif)" [class.unread]="!notif.read">
          <ion-label>
            <p>{{ notif.message }}</p>
            <ion-note>{{ notif.createdAt | date:'short' }}</ion-note>
          </ion-label>

          @if (notif.type === NotificationType.FILE_TRANSFER_REQUEST && !notif.read) {
            <div class="actions" slot="end">
              <ion-button fill="clear" color="success" (click)="confirmTransfer($event, notif)">
                <ion-icon slot="icon-only" name="checkmark-outline"></ion-icon>
              </ion-button>
              <ion-button fill="clear" color="danger" (click)="rejectTransfer($event, notif)">
                <ion-icon slot="icon-only" name="close-circle-outline"></ion-icon>
              </ion-button>
            </div>
          }
        </ion-item>
      } @empty {
        <ion-item lines="none">
          <ion-label class="ion-text-center ion-padding">No notifications</ion-label>
        </ion-item>
      }
    </ion-list>
  `,
  styles: [`.unread { --background: var(--ion-color-light-tint); } .actions { display: flex; }`],
  standalone: true,
  imports: [CommonModule, IonList, IonItem, IonLabel, IonNote, IonIcon, IonButton]
})
export class NotificationsPopoverComponent {
  public notificationService = inject(NotificationService);
  private fileLogService = inject(FileLogService);
  private router = inject(Router);
  private popoverCtrl = inject(PopoverController);
  private toastCtrl = inject(ToastController);

  // Expose enum to template
  public NotificationType = NotificationType;

  constructor() {
    addIcons({ checkmarkOutline, closeCircleOutline });
  }

  async onNotificationClick(notif: INotification) {
    await this.notificationService.markAsRead(notif);
    this.router.navigateByUrl(notif.link);
    this.popoverCtrl.dismiss();
  }

  async confirmTransfer(event: MouseEvent, notif: INotification) {
    event.stopPropagation(); // Prevent item click from firing
    const [_, __, matterId] = notif.link.split('/');
    this.fileLogService.confirmTransfer(matterId, notif.relatedId!).subscribe(async () => {
      await this.notificationService.markAsRead(notif);
      const toast = await this.toastCtrl.create({ message: 'File transfer confirmed.', duration: 2000, color: 'success' });
      toast.present();
    });
  }

  async rejectTransfer(event: MouseEvent, notif: INotification) {
    event.stopPropagation();
    const [_, __, matterId] = notif.link.split('/');
    this.fileLogService.rejectTransfer(matterId, notif.relatedId!).subscribe(async () => {
      // The notification will automatically update to 'read' via the real-time listener
      // because the backend logic will create a new 'rejected' notification for the sender.
      const toast = await this.toastCtrl.create({ message: 'File transfer rejected.', duration: 2000, color: 'medium' });
      toast.present();
    });
  }
}