import { inject, injectable } from 'tsyringe';
import { Booking, Room } from '@teddy-city-hotels/shared-interfaces';
import { FirestoreService } from './firestore.service';
import { NotFoundError } from '../errors/http-errors';
import { Timestamp } from 'firebase-admin/firestore';
import { PaystackService } from './paystack.service';

@injectable()
export class BookingService {
  constructor(
    @inject(FirestoreService) private firestore: FirestoreService,
    @inject(PaystackService) private paystackService: PaystackService,
  ) {}

  private getBookingsCollection() {
    return this.firestore.db.collection('bookings');
  }

  private getRoomsCollection() {
    return this.firestore.db.collection('rooms');
  }

  async createBooking(bookingData: any, user: any): Promise<any> {
    const { roomId, checkInDate, checkOutDate, numberOfGuests } = bookingData;
    const { email, uid } = user;

    const roomRef = this.getRoomsCollection().doc(roomId);
    const roomDoc = await roomRef.get();

    if (!roomDoc.exists) {
      throw new NotFoundError(`Room with ID "${roomId}" not found.`);
    }

    const room = roomDoc.data() as Room;

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24);
    const totalPrice = nights * room.price;

    const newBooking: Booking = {
      id: '',
      roomId,
      userId: uid,
      checkInDate: Timestamp.fromDate(checkIn),
      checkOutDate: Timestamp.fromDate(checkOut),
      numberOfGuests,
      totalPrice,
      status: 'pending',
      createdAt: Timestamp.now(),
    };

    const bookingRef = await this.getBookingsCollection().add(newBooking);
    newBooking.id = bookingRef.id;

    await bookingRef.update({ id: bookingRef.id });

    const paymentData = await this.paystackService.initializePayment(email, totalPrice, newBooking.id);

    return { booking: newBooking, paymentData };
  }

  async getBookingById(bookingId: string): Promise<Booking> {
    const doc = await this.getBookingsCollection().doc(bookingId).get();
    if (!doc.exists) {
      throw new NotFoundError(`Booking with ID "${bookingId}" not found.`);
    }
    return { id: doc.id, ...doc.data() } as Booking;
  }

  async updateBookingStatus(bookingId: string, status: 'pending' | 'confirmed' | 'cancelled'): Promise<void> {
    const bookingRef = this.getBookingsCollection().doc(bookingId);
    await bookingRef.update({ status });
  }
}
