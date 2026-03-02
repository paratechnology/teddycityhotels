import { inject, injectable } from 'tsyringe';
import { FirestoreService } from './firestore.service';
import { IHotelDashboardStats } from '@teddy-city-hotels/shared-interfaces';
import { NotificationService } from './notification.service';

@injectable()
export class AdminDashboardService {
  constructor(
    @inject(FirestoreService) private firestore: FirestoreService,
    @inject(NotificationService) private notificationsService: NotificationService
  ) {}

  private normalizeDate(input: unknown): Date {
    if (input instanceof Date) return input;
    if (typeof input === 'string') return new Date(input);
    if (input && typeof input === 'object' && 'toDate' in (input as { toDate: () => Date })) {
      return (input as { toDate: () => Date }).toDate();
    }
    return new Date();
  }

  async getStats(): Promise<IHotelDashboardStats> {
    const [roomsSnap, bookingsSnap, notifications] = await Promise.all([
      this.firestore.db.collection('rooms').get(),
      this.firestore.db.collection('bookings').get(),
      this.notificationsService.getAdminNotifications(),
    ]);

    const totalRooms = roomsSnap.size;
    const availableRooms = roomsSnap.docs.filter((doc) => doc.data()?.availability?.isAvailable !== false).length;
    const occupiedRooms = totalRooms - availableRooms;
    const occupancyRate = totalRooms === 0 ? 0 : Number(((occupiedRooms / totalRooms) * 100).toFixed(2));

    const bookings = bookingsSnap.docs.map((doc) => doc.data() as any);
    const activeBookings = bookings.filter((booking) => ['confirmed', 'checked_in'].includes(booking.status)).length;
    const pendingBookings = bookings.filter((booking) => booking.status === 'pending').length;

    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);
    const monthKey = today.toISOString().slice(0, 7);

    const todayRevenue = bookings
      .filter((booking) => ['confirmed', 'checked_in', 'checked_out'].includes(booking.status))
      .filter((booking) => this.normalizeDate(booking.createdAt).toISOString().startsWith(todayKey))
      .reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0);

    const monthRevenue = bookings
      .filter((booking) => ['confirmed', 'checked_in', 'checked_out'].includes(booking.status))
      .filter((booking) => this.normalizeDate(booking.createdAt).toISOString().startsWith(monthKey))
      .reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0);

    const pendingNotifications = notifications.filter((n) => !n.read).length;

    return {
      totalRooms,
      availableRooms,
      occupiedRooms,
      occupancyRate,
      totalBookings: bookings.length,
      activeBookings,
      pendingBookings,
      todayRevenue,
      monthRevenue,
      pendingNotifications,
    };
  }
}
