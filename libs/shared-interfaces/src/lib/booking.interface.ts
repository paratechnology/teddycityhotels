import { Timestamp } from 'firebase/firestore';

export interface Booking {
  id: string;
  roomId: string;
  userId: string; // The ID of the user who made the booking
  checkInDate: Timestamp;
  checkOutDate: Timestamp;
  numberOfGuests: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Timestamp;
}
