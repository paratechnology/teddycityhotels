import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Booking } from '@teddy-city-hotels/shared-interfaces';
import { baseURL } from '@teddy-city-hotels/shared-interfaces';

@Injectable({
  providedIn: 'root'
})
export class BookingService {

  private bookingsUrl = `${baseURL}bookings`;

  constructor(private http: HttpClient) { }

  getBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(this.bookingsUrl);
  }

  getBooking(id: string): Observable<Booking> {
    const url = `${this.bookingsUrl}/${id}`;
    return this.http.get<Booking>(url);
  }

  addBooking(booking: Booking): Observable<Booking> {
    return this.http.post<Booking>(this.bookingsUrl, booking);
  }

  updateBooking(booking: Booking): Observable<any> {
    const url = `${this.bookingsUrl}/${booking.id}`;
    return this.http.put(url, booking);
  }

  deleteBooking(id: string): Observable<Booking> {
    const url = `${this.bookingsUrl}/${id}`;
    return this.http.delete<Booking>(url);
  }
}
