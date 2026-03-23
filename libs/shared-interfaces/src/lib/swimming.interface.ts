import { PaginatedResponse } from './legacy-compat.interface';
import { IPaymentInitializationData } from './response';

export type SwimmingBookingType = 'day_pass' | 'family_pass' | 'lessons' | 'membership';
export type SwimmingBookingStatus = 'new' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled';
export type SwimmingPaymentMethod = 'online' | 'cash';
export type SwimmingPaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface ISwimmingOffer {
  type: SwimmingBookingType;
  name: string;
  description: string;
  price: number;
  unitLabel: string;
  highlights: string[];
  featured?: boolean;
}

export interface ISwimmingBooking {
  id: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  bookingType: SwimmingBookingType;
  visitDate: string;
  attendees: number;
  amount: number;
  paymentMethod: SwimmingPaymentMethod;
  paymentStatus: SwimmingPaymentStatus;
  status: SwimmingBookingStatus;
  note?: string;
  source: 'website' | 'admin';
  paymentReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateSwimmingBookingDto {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  bookingType: SwimmingBookingType;
  visitDate: string;
  attendees?: number;
  paymentMethod: SwimmingPaymentMethod;
  note?: string;
  source?: 'website' | 'admin';
  callbackUrl?: string;
}

export interface IUpdateSwimmingBookingStatusDto {
  status: SwimmingBookingStatus;
}

export interface IUpdateSwimmingPaymentStatusDto {
  paymentStatus: SwimmingPaymentStatus;
}

export interface ISwimmingBookingCreateResponse {
  booking: ISwimmingBooking;
  paymentData?: IPaymentInitializationData;
}

export interface ISwimmingBookingsResponse {
  rows: PaginatedResponse<ISwimmingBooking>;
  totals: {
    totalBookings: number;
    pendingPayments: number;
    activeBookings: number;
    totalPaidRevenue: number;
  };
  offers: ISwimmingOffer[];
}
