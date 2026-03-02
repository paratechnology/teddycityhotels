import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IAdminNotification, baseURL } from '@teddy-city-hotels/shared-interfaces';

@Injectable({ providedIn: 'root' })
export class AdminNotificationService {
  private notificationsUrl = `${baseURL}notifications`;

  constructor(private http: HttpClient) {}

  registerToken(token: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.notificationsUrl}/register-token`, { token });
  }

  list(): Observable<IAdminNotification[]> {
    return this.http.get<IAdminNotification[]>(this.notificationsUrl);
  }

  markAsRead(id: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.notificationsUrl}/${id}/read`, {});
  }
}
