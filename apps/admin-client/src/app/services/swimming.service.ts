import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  baseURL,
  ISwimmingBooking,
  ISwimmingBookingsResponse,
  IUpdateSwimmingBookingStatusDto,
  IUpdateSwimmingPaymentStatusDto,
  SwimmingBookingStatus,
  SwimmingBookingType,
  SwimmingPaymentMethod,
  SwimmingPaymentStatus,
} from '@teddy-city-hotels/shared-interfaces';

@Injectable({
  providedIn: 'root',
})
export class SwimmingAdminService {
  private swimmingUrl = `${baseURL}swimming`;

  constructor(private http: HttpClient) {}

  listBookings(params: {
    page: number;
    pageSize: number;
    search?: string;
    bookingType?: SwimmingBookingType | '';
    status?: SwimmingBookingStatus | '';
    paymentStatus?: SwimmingPaymentStatus | '';
    paymentMethod?: SwimmingPaymentMethod | '';
  }): Observable<ISwimmingBookingsResponse> {
    const query = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize),
    });

    if (params.search?.trim()) query.set('search', params.search.trim());
    if (params.bookingType) query.set('bookingType', params.bookingType);
    if (params.status) query.set('status', params.status);
    if (params.paymentStatus) query.set('paymentStatus', params.paymentStatus);
    if (params.paymentMethod) query.set('paymentMethod', params.paymentMethod);

    return this.http.get<ISwimmingBookingsResponse>(`${this.swimmingUrl}/bookings?${query.toString()}`);
  }

  updateStatus(bookingId: string, payload: IUpdateSwimmingBookingStatusDto): Observable<ISwimmingBooking> {
    return this.http.patch<ISwimmingBooking>(`${this.swimmingUrl}/bookings/${bookingId}/status`, payload);
  }

  updatePaymentStatus(
    bookingId: string,
    payload: IUpdateSwimmingPaymentStatusDto
  ): Observable<ISwimmingBooking> {
    return this.http.patch<ISwimmingBooking>(
      `${this.swimmingUrl}/bookings/${bookingId}/payment-status`,
      payload
    );
  }
}
