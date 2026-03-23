import { Router } from 'express';
import { container } from 'tsyringe';
import { SwimmingController } from '../controllers/swimming.controller';
import { verifyUser } from '../middleware/authenticate.middleware';
import { adminOnly, requireModuleAccess } from '../middleware/admin.middleware';

export class SwimmingRoutes {
  public router: Router;
  private controller: SwimmingController;

  constructor() {
    this.router = Router();
    this.controller = container.resolve(SwimmingController);
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/offers', this.controller.listOffers);
    this.router.post('/bookings', this.controller.createBooking);

    this.router.get(
      '/bookings',
      verifyUser,
      adminOnly,
      requireModuleAccess('financials'),
      this.controller.listBookings
    );
    this.router.patch(
      '/bookings/:bookingId/status',
      verifyUser,
      adminOnly,
      requireModuleAccess('financials'),
      this.controller.updateStatus
    );
    this.router.patch(
      '/bookings/:bookingId/payment-status',
      verifyUser,
      adminOnly,
      requireModuleAccess('financials'),
      this.controller.updatePaymentStatus
    );
  }
}
