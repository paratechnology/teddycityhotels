import { Router } from 'express';
import { container } from 'tsyringe';
import { BookingController } from '../controllers/booking.controller';
import { adminOnly, requireModuleAccess } from '../middleware/admin.middleware';
import { optionalVerifyUser, verifyUser } from '../middleware/authenticate.middleware';

export class BookingRoutes {
  public router: Router;
  private controller: BookingController;

  constructor() {
    this.router = Router();
    this.controller = container.resolve(BookingController);
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post('/', optionalVerifyUser, this.controller.createBooking);

    this.router.get(
      '/',
      verifyUser,
      adminOnly,
      requireModuleAccess('bookings'),
      this.controller.getAllBookings
    );
    this.router.post(
      '/admin',
      verifyUser,
      adminOnly,
      requireModuleAccess('bookings'),
      this.controller.createAdminBooking
    );
    this.router.patch(
      '/:bookingId/status',
      verifyUser,
      adminOnly,
      requireModuleAccess('bookings'),
      this.controller.updateBookingStatus
    );

    this.router.get('/:bookingId', this.controller.getBookingById);
  }
}
