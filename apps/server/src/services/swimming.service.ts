import { inject, injectable } from 'tsyringe';
import {
  ICreateSwimmingBookingDto,
  ISwimmingBooking,
  ISwimmingBookingCreateResponse,
  ISwimmingBookingsResponse,
  ISwimmingOffer,
  NotificationType,
  PaginatedResponse,
  SwimmingBookingStatus,
  SwimmingBookingType,
  SwimmingPaymentMethod,
  SwimmingPaymentStatus,
} from '@teddy-city-hotels/shared-interfaces';
import { FirestoreService } from './firestore.service';
import { BadRequestError, NotFoundError } from '../errors/http-errors';
import { NotificationService } from './notification.service';
import { FinancialsService } from './financials.service';
import { PaystackService } from './paystack.service';

@injectable()
export class SwimmingService {
  private readonly offers: ISwimmingOffer[] = [
    {
      type: 'day_pass',
      name: 'Day Pass',
      description: 'Flexible pool access for hotel guests and daytime visitors.',
      price: 5000,
      unitLabel: 'per guest',
      highlights: ['Pool access', 'Changing room access', 'Poolside seating'],
      featured: true,
    },
    {
      type: 'family_pass',
      name: 'Family Pass',
      description: 'One booking for a small family group or shared outing.',
      price: 18000,
      unitLabel: 'per group',
      highlights: ['Up to 4 guests', 'Pool access', 'Family seating zone'],
    },
    {
      type: 'lessons',
      name: 'Swimming Lessons',
      description: 'Structured beginner-to-intermediate sessions with an instructor.',
      price: 12000,
      unitLabel: 'per guest',
      highlights: ['Instructor-led session', 'Beginner friendly', 'Small-group format'],
    },
    {
      type: 'membership',
      name: 'Monthly Membership',
      description: 'Recurring-style monthly access managed manually by the hotel team.',
      price: 35000,
      unitLabel: 'per member',
      highlights: ['Priority access', 'Extended hours', 'Front desk support'],
    },
  ];

  constructor(
    @inject(FirestoreService) private firestore: FirestoreService,
    @inject(PaystackService) private paystackService: PaystackService,
    @inject(NotificationService) private notificationService: NotificationService,
    @inject(FinancialsService) private financialsService: FinancialsService
  ) {}

  private getCollection() {
    return this.firestore.db.collection('swimmingBookings');
  }

  private normalizePaging(params: { page?: number; pageSize?: number }) {
    return {
      page: Number.isFinite(params.page) ? Math.max(1, Number(params.page)) : 1,
      pageSize: Number.isFinite(params.pageSize)
        ? Math.min(100, Math.max(1, Number(params.pageSize)))
        : 12,
    };
  }

  private getOffer(bookingType: SwimmingBookingType): ISwimmingOffer {
    const offer = this.offers.find((row) => row.type === bookingType);
    if (!offer) {
      throw new BadRequestError('Unknown swimming booking type.');
    }
    return offer;
  }

  private parseVisitDate(input: unknown): string {
    const date = new Date(String(input || ''));
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestError('Visit date must be a valid date.');
    }
    return date.toISOString();
  }

  private resolveAmount(bookingType: SwimmingBookingType, attendees: number): number {
    const offer = this.getOffer(bookingType);
    if (bookingType === 'family_pass') {
      return offer.price;
    }
    return offer.price * attendees;
  }

  listOffers(): ISwimmingOffer[] {
    return this.offers;
  }

  async createBooking(payload: ICreateSwimmingBookingDto): Promise<ISwimmingBookingCreateResponse> {
    const customerName = String(payload.customerName || '').trim();
    const customerEmail = String(payload.customerEmail || '').trim().toLowerCase() || undefined;
    const customerPhone = String(payload.customerPhone || '').trim() || undefined;
    const note = String(payload.note || '').trim() || undefined;
    const bookingType = payload.bookingType;
    const paymentMethod: SwimmingPaymentMethod = payload.paymentMethod;
    const attendees = Math.max(1, Number(payload.attendees || 1));

    if (!customerName) throw new BadRequestError('Customer name is required.');
    if (!bookingType) throw new BadRequestError('Swimming booking type is required.');
    if (paymentMethod === 'online' && !customerEmail) {
      throw new BadRequestError('Customer email is required for online payment.');
    }

    const visitDate = this.parseVisitDate(payload.visitDate);
    const amount = this.resolveAmount(bookingType, attendees);
    const now = new Date().toISOString();

    const ref = this.getCollection().doc();
    const booking: ISwimmingBooking = {
      id: ref.id,
      customerName,
      customerEmail,
      customerPhone,
      bookingType,
      visitDate,
      attendees,
      amount,
      paymentMethod,
      paymentStatus: 'pending',
      status: 'new',
      note,
      source: payload.source || 'website',
      createdAt: now,
      updatedAt: now,
    };

    await ref.set(booking);

    await this.notificationService.createAdminNotification({
      title: 'New Swimming Booking',
      body: `${booking.customerName} requested ${booking.bookingType.replace(/_/g, ' ')} access.`,
      type: NotificationType.SWIMMING_BOOKING_CREATED,
      link: '/swimming',
      relatedId: booking.id,
    });

    if (paymentMethod === 'online') {
      const paymentData = await this.paystackService.initializeTransaction({
        email: String(customerEmail || '').trim(),
        amount,
        callbackUrl: payload.callbackUrl,
        metadata: {
          type: 'swimming_booking',
          bookingId: booking.id,
          bookingType: booking.bookingType,
        },
      });

      await ref.set(
        {
          paymentReference: paymentData.reference,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return {
        booking: { ...booking, paymentReference: paymentData.reference },
        paymentData,
      };
    }

    return { booking };
  }

  async listBookings(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    bookingType?: SwimmingBookingType;
    status?: SwimmingBookingStatus;
    paymentStatus?: SwimmingPaymentStatus;
    paymentMethod?: SwimmingPaymentMethod;
  }): Promise<ISwimmingBookingsResponse> {
    const paging = this.normalizePaging(params);
    const snapshot = await this.getCollection().orderBy('createdAt', 'desc').get();
    const rows = snapshot.empty
      ? []
      : snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ISwimmingBooking));

    let filtered = rows;
    if (params.bookingType) filtered = filtered.filter((row) => row.bookingType === params.bookingType);
    if (params.status) filtered = filtered.filter((row) => row.status === params.status);
    if (params.paymentStatus) filtered = filtered.filter((row) => row.paymentStatus === params.paymentStatus);
    if (params.paymentMethod) filtered = filtered.filter((row) => row.paymentMethod === params.paymentMethod);
    if (params.search?.trim()) {
      const search = params.search.trim().toLowerCase();
      filtered = filtered.filter((row) => {
        return (
          row.id.toLowerCase().includes(search) ||
          row.customerName.toLowerCase().includes(search) ||
          (row.customerEmail || '').toLowerCase().includes(search) ||
          (row.customerPhone || '').toLowerCase().includes(search) ||
          row.bookingType.toLowerCase().includes(search)
        );
      });
    }

    const total = filtered.length;
    const start = (paging.page - 1) * paging.pageSize;
    const pagedRows: PaginatedResponse<ISwimmingBooking> = {
      data: filtered.slice(start, start + paging.pageSize),
      total,
      page: paging.page,
      pageSize: paging.pageSize,
    };

    return {
      rows: pagedRows,
      totals: {
        totalBookings: rows.length,
        pendingPayments: rows.filter((row) => row.paymentStatus === 'pending').length,
        activeBookings: rows.filter((row) => ['new', 'confirmed', 'checked_in'].includes(row.status)).length,
        totalPaidRevenue: rows
          .filter((row) => row.paymentStatus === 'paid')
          .reduce((sum, row) => sum + Number(row.amount || 0), 0),
      },
      offers: this.listOffers(),
    };
  }

  async getBookingById(bookingId: string): Promise<ISwimmingBooking> {
    const doc = await this.getCollection().doc(bookingId).get();
    if (!doc.exists) {
      throw new NotFoundError('Swimming booking not found.');
    }

    return { id: doc.id, ...doc.data() } as ISwimmingBooking;
  }

  async updateStatus(bookingId: string, status: SwimmingBookingStatus): Promise<ISwimmingBooking> {
    const ref = this.getCollection().doc(bookingId);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new NotFoundError('Swimming booking not found.');
    }

    await ref.set(
      {
        status,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    const next = await ref.get();
    const booking = { id: next.id, ...next.data() } as ISwimmingBooking;

    await this.notificationService.createAdminNotification({
      title: 'Swimming Booking Updated',
      body: `${booking.customerName}'s swimming booking moved to ${status}.`,
      type: NotificationType.SWIMMING_BOOKING_STATUS_CHANGED,
      link: '/swimming',
      relatedId: booking.id,
    });

    return booking;
  }

  async updatePaymentStatus(
    bookingId: string,
    paymentStatus: SwimmingPaymentStatus
  ): Promise<ISwimmingBooking> {
    const ref = this.getCollection().doc(bookingId);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new NotFoundError('Swimming booking not found.');
    }

    const current = { id: doc.id, ...doc.data() } as ISwimmingBooking;

    await ref.set(
      {
        paymentStatus,
        status: paymentStatus === 'paid' && current.status === 'new' ? 'confirmed' : current.status,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    const next = await ref.get();
    const booking = { id: next.id, ...next.data() } as ISwimmingBooking;
    await this.financialsService.upsertSwimmingBookingRevenue(booking);

    await this.notificationService.createAdminNotification({
      title: 'Swimming Payment Updated',
      body: `${booking.customerName}'s payment is now ${paymentStatus}.`,
      type: NotificationType.SWIMMING_PAYMENT_STATUS_CHANGED,
      link: '/swimming',
      relatedId: booking.id,
    });

    return booking;
  }
}
