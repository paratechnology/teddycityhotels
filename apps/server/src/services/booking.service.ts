import { inject, injectable } from 'tsyringe';
import {
  Booking,
  BookingStatus,
  CreateBookingDto,
  NotificationType,
  PaginatedResponse,
  Room,
} from '@teddy-city-hotels/shared-interfaces';
import { FirestoreService } from './firestore.service';
import { BadRequestError, NotFoundError } from '../errors/http-errors';
import { Timestamp } from 'firebase-admin/firestore';
import { PaystackService } from './paystack.service';
import { RoomService } from './room.service';
import { NotificationService } from './notification.service';
import { FinancialsService } from './financials.service';

@injectable()
export class BookingService {
  constructor(
    @inject(FirestoreService) private firestore: FirestoreService,
    @inject(PaystackService) private paystackService: PaystackService,
    @inject(RoomService) private roomService: RoomService,
    @inject(NotificationService) private notificationService: NotificationService,
    @inject(FinancialsService) private financialsService: FinancialsService
  ) {}

  private getBookingsCollection() {
    return this.firestore.db.collection('bookings');
  }

  private getRoomsCollection() {
    return this.firestore.db.collection('rooms');
  }

  private asDate(value: unknown): Date {
    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'string') {
      const dt = new Date(value);
      if (!Number.isNaN(dt.getTime())) {
        return dt;
      }
    }

    if (value && typeof value === 'object' && 'toDate' in (value as { toDate?: () => Date })) {
      return (value as { toDate: () => Date }).toDate();
    }

    throw new BadRequestError('Invalid date value in booking payload.');
  }

  async createBooking(bookingData: CreateBookingDto, user?: { email?: string; id?: string }): Promise<any> {
    const {
      roomId,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      guestName,
      guestEmail,
      guestPhone,
      notes,
      callbackUrl,
    } = bookingData;

    const roomRef = this.getRoomsCollection().doc(roomId);
    const roomDoc = await roomRef.get();

    if (!roomDoc.exists) {
      throw new NotFoundError(`Room with ID "${roomId}" not found.`);
    }

    const room = roomDoc.data() as Room;

    const checkIn = this.asDate(checkInDate);
    const checkOut = this.asDate(checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      throw new BadRequestError('Check-out date must be after check-in date.');
    }

    const totalPrice = nights * room.price;

    const newBooking: Booking = {
      id: '',
      roomId,
      userId: user?.id || 'guest',
      guestName,
      guestEmail,
      guestPhone,
      checkInDate: Timestamp.fromDate(checkIn),
      checkOutDate: Timestamp.fromDate(checkOut),
      numberOfGuests,
      nights,
      totalPrice,
      status: 'pending',
      source: bookingData.source || 'website',
      notes,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const bookingRef = await this.getBookingsCollection().add(newBooking);
    newBooking.id = bookingRef.id;

    await bookingRef.update({ id: bookingRef.id });
    await this.roomService.syncRoomAvailability(roomId);

    await this.notificationService.createAdminNotification({
      title: 'New Booking',
      body: `${guestName || 'Guest'} created booking ${bookingRef.id}.`,
      type: NotificationType.BOOKING_CREATED,
      link: `/bookings/${bookingRef.id}`,
      bookingId: bookingRef.id,
    });

    const payerEmail = guestEmail || user?.email;
    if (payerEmail) {
      const paymentData = await this.paystackService.initializeTransaction({
        email: payerEmail,
        amount: totalPrice,
        callbackUrl,
        metadata: {
          type: 'booking',
          bookingId: newBooking.id,
        },
      });
      return { booking: newBooking, paymentData };
    }

    return { booking: newBooking };
  }

  async createAdminBooking(bookingData: CreateBookingDto, adminUserId: string): Promise<Booking> {
    const result = await this.createBooking({ ...bookingData, source: 'admin' }, { id: adminUserId, email: bookingData.guestEmail });
    const booking = (result.booking || result) as Booking;
    return booking;
  }

  async getAllBookings(filters?: { status?: BookingStatus; roomId?: string }): Promise<Booking[]> {
    let query: FirebaseFirestore.Query = this.getBookingsCollection().orderBy('createdAt', 'desc');

    if (filters?.status) {
      query = query.where('status', '==', filters.status);
    }

    if (filters?.roomId) {
      query = query.where('roomId', '==', filters.roomId);
    }

    const snapshot = await query.get();
    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Booking));
  }

  async getBookingsPaginated(params: {
    page: number;
    pageSize: number;
    status?: BookingStatus;
    roomId?: string;
    search?: string;
  }): Promise<PaginatedResponse<Booking>> {
    const page = Number.isFinite(params.page) ? Math.max(1, params.page) : 1;
    const pageSize = Number.isFinite(params.pageSize)
      ? Math.min(100, Math.max(1, params.pageSize))
      : 12;

    if (!params.search?.trim() && !params.status && !params.roomId) {
      const baseQuery = this.getBookingsCollection().orderBy('createdAt', 'desc');
      const total = (await this.getBookingsCollection().count().get()).data().count;
      const start = (page - 1) * pageSize;
      const snapshot = await baseQuery.offset(start).limit(pageSize).get();

      return {
        data: snapshot.empty
          ? []
          : snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Booking)),
        total,
        page,
        pageSize,
      };
    }

    const records = await this.getAllBookings({
      status: params.status,
      roomId: params.roomId,
    });

    let filtered = records;
    if (params.search?.trim()) {
      const search = params.search.trim().toLowerCase();
      filtered = records.filter((booking) => {
        const guestName = (booking.guestName || '').toLowerCase();
        const guestEmail = (booking.guestEmail || '').toLowerCase();
        const guestPhone = (booking.guestPhone || '').toLowerCase();
        const bookingId = booking.id.toLowerCase();
        return (
          guestName.includes(search) ||
          guestEmail.includes(search) ||
          guestPhone.includes(search) ||
          bookingId.includes(search)
        );
      });
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  async getBookingById(bookingId: string): Promise<Booking> {
    const doc = await this.getBookingsCollection().doc(bookingId).get();
    if (!doc.exists) {
      throw new NotFoundError(`Booking with ID "${bookingId}" not found.`);
    }
    return { id: doc.id, ...doc.data() } as Booking;
  }

  async updateBookingStatus(bookingId: string, status: BookingStatus): Promise<Booking> {
    const bookingRef = this.getBookingsCollection().doc(bookingId);
    const existing = await bookingRef.get();

    if (!existing.exists) {
      throw new NotFoundError(`Booking with ID "${bookingId}" not found.`);
    }

    await bookingRef.update({ status, updatedAt: Timestamp.now() });

    const nextDoc = await bookingRef.get();
    const booking = { id: nextDoc.id, ...nextDoc.data() } as Booking;

    await this.roomService.syncRoomAvailability(booking.roomId);

    await this.notificationService.createAdminNotification({
      title: 'Booking Updated',
      body: `Booking ${bookingId} status changed to ${status}.`,
      type: NotificationType.BOOKING_STATUS_CHANGED,
      link: `/bookings/${bookingId}`,
      bookingId,
    });

    await this.financialsService.upsertBookingRevenue(booking);

    return booking;
  }
}
