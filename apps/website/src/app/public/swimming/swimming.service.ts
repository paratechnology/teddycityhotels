import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  baseURL,
  ICreateSwimmingBookingDto,
  ISwimmingBookingCreateResponse,
  ISwimmingOffer,
} from '@teddy-city-hotels/shared-interfaces';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PublicSwimmingService {
  private http = inject(HttpClient);
  private readonly swimmingUrl = `${baseURL}swimming`;

  getOffers(): Observable<ISwimmingOffer[]> {
    return this.http.get<ISwimmingOffer[]>(`${this.swimmingUrl}/offers`);
  }

  createBooking(payload: ICreateSwimmingBookingDto): Observable<ISwimmingBookingCreateResponse> {
    return this.http.post<ISwimmingBookingCreateResponse>(`${this.swimmingUrl}/bookings`, payload);
  }
}
