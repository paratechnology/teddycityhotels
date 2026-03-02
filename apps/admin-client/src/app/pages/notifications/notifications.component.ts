import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IAdminNotification } from '@teddy-city-hotels/shared-interfaces';
import { AdminNotificationService } from '../../services/admin-notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
})
export class NotificationsComponent implements OnInit {
  notifications: IAdminNotification[] = [];
  loading = false;

  constructor(private notificationsService: AdminNotificationService) {}

  ngOnInit(): void {
    const token = localStorage.getItem('fcmToken');
    if (token) {
      this.notificationsService.registerToken(token).subscribe();
    }
    this.load();
  }

  load(): void {
    this.loading = true;
    this.notificationsService.list().subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  markRead(notification: IAdminNotification): void {
    if (notification.read) {
      return;
    }

    this.notificationsService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.read = true;
      },
    });
  }
}

