import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IAdminNotification, PaginatedResponse } from '@teddy-city-hotels/shared-interfaces';
import { AdminNotificationService } from '../../services/admin-notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
})
export class NotificationsComponent implements OnInit {
  notifications: IAdminNotification[] = [];
  loading = false;
  page = 1;
  pageSize = 10;
  total = 0;
  search = '';
  error = '';
  activeTab: 'all' | 'unread' | 'read' = 'all';

  constructor(private notificationsService: AdminNotificationService) {}

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  ngOnInit(): void {
    const token = localStorage.getItem('fcmToken');
    if (token) {
      this.notificationsService.registerToken(token).subscribe({
        error: () => {
          // Non-blocking registration; listing still loads.
        },
      });
    }
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.notificationsService
      .list({
        page: this.page,
        pageSize: this.pageSize,
        search: this.search,
        read: this.activeTab,
      })
      .subscribe({
        next: (response) => {
          if (Array.isArray(response)) {
            this.notifications = response;
            this.total = response.length;
          } else {
            const paged = response as PaginatedResponse<IAdminNotification>;
            this.notifications = paged.data;
            this.total = paged.total;
            this.page = paged.page;
            this.pageSize = paged.pageSize;
          }
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          this.error = error?.error?.message || 'Failed to load notifications.';
        },
      });
  }

  applyFilters(): void {
    this.page = 1;
    this.load();
  }

  switchTab(tab: 'all' | 'unread' | 'read'): void {
    if (tab === this.activeTab) return;
    this.activeTab = tab;
    this.page = 1;
    this.load();
  }

  clearFilters(): void {
    this.search = '';
    this.page = 1;
    this.load();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.page) return;
    this.page = page;
    this.load();
  }

  markRead(notification: IAdminNotification): void {
    if (notification.read) return;

    this.notificationsService.markAsRead(notification.id).subscribe({
      next: () => {
        if (this.activeTab === 'unread') {
          this.load();
          return;
        }
        notification.read = true;
      },
      error: (error) => {
        this.error = error?.error?.message || 'Failed to mark notification as read.';
      },
    });
  }
}
