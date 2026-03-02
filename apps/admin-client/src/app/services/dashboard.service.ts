import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IHotelDashboardStats, baseURL } from '@teddy-city-hotels/shared-interfaces';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private http: HttpClient) {}

  getStats(): Observable<IHotelDashboardStats> {
    return this.http.get<IHotelDashboardStats>(`${baseURL}admin/dashboard`);
  }
}
