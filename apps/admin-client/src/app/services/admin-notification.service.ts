import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IAdminNotification, PaginatedResponse, baseURL } from '@teddy-city-hotels/shared-interfaces';

@Injectable({ providedIn: 'root' })
export class AdminNotificationService {
  private notificationsUrl = `${baseURL}notifications`;

  constructor(private http: HttpClient) {}

  registerToken(token: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.notificationsUrl}/register-token`, { token });
  }

  list(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    read?: 'all' | 'read' | 'unread';
  }): Observable<IAdminNotification[] | PaginatedResponse<IAdminNotification>> {
    if (!params || (!params.page && !params.pageSize && !params.search && !params.read)) {
      return this.http.get<IAdminNotification[]>(this.notificationsUrl);
    }

    const query = new URLSearchParams({
      page: String(params.page || 1),
      pageSize: String(params.pageSize || 12),
    });
    if (params.search?.trim()) query.set('search', params.search.trim());
    if (params.read && params.read !== 'all') query.set('read', params.read);
    return this.http.get<PaginatedResponse<IAdminNotification>>(`${this.notificationsUrl}?${query.toString()}`);
  }

  markAsRead(id: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.notificationsUrl}/${id}/read`, {});
  }
}
