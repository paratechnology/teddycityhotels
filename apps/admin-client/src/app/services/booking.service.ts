import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Booking,
  PaginatedResponse,
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

  getBookings(params: {
    page: number;
    pageSize: number;
    status?: BookingStatus | '';
    roomId?: string;
    search?: string;
  }): Observable<PaginatedResponse<Booking>> {
    const query = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize),
    });

    if (params.status) query.set('status', params.status);
    if (params.roomId) query.set('roomId', params.roomId);
    if (params.search?.trim()) query.set('search', params.search.trim());

    return this.http.get<PaginatedResponse<Booking>>(`${this.bookingsUrl}?${query.toString()}`);
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
