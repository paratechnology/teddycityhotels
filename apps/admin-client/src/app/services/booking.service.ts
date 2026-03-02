import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Booking,
  BookingStatus,
  CreateBookingDto,
  baseURL,
} from '@teddy-city-hotels/shared-interfaces';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private bookingsUrl = `${baseURL}bookings`;

  constructor(private http: HttpClient) {}

  getBookings(status?: BookingStatus): Observable<Booking[]> {
    const query = status ? `?status=${status}` : '';
    return this.http.get<Booking[]>(`${this.bookingsUrl}${query}`);
  }

  getBooking(id: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.bookingsUrl}/${id}`);
  }

  addBooking(booking: CreateBookingDto): Observable<Booking> {
    return this.http.post<Booking>(`${this.bookingsUrl}/admin`, booking);
  }

  updateBookingStatus(bookingId: string, status: BookingStatus): Observable<Booking> {
    return this.http.patch<Booking>(`${this.bookingsUrl}/${bookingId}/status`, { status });
  }
}
