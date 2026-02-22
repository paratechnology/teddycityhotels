import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Booking } from '@teddy-city-hotels/shared-interfaces';
import { Observable } from 'rxjs';
import { BookingResponse } from './booking.response.interface';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private http = inject(HttpClient);
  private baseUrl = '/api/bookings'; // Assuming the server is running on the same host

  createBooking(bookingData: any): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(this.baseUrl, bookingData);
  }

  getBookingById(bookingId: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.baseUrl}/${bookingId}`);
  }
}
