export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'checked_in' | 'checked_out';
export type BookingSource = 'website' | 'admin';

export type DateLike = string | Date | { toDate: () => Date };

export interface Booking {
  id: string;
  roomId: string;
  userId: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  checkInDate: DateLike;
  checkOutDate: DateLike;
  numberOfGuests: number;
  nights?: number;
  totalPrice: number;
  status: BookingStatus;
  source?: BookingSource;
  notes?: string;
  createdAt: DateLike;
  updatedAt?: DateLike;
}

export interface CreateBookingDto {
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  notes?: string;
  source?: BookingSource;
}

export interface UpdateBookingStatusDto {
  status: BookingStatus;
}
