import { Router } from 'express';
import { container } from 'tsyringe';
import { BookingController } from '../controllers/booking.controller';

export class BookingRoutes {
  public router: Router;
  private controller: BookingController;

  constructor() {
    this.router = Router();
    this.controller = container.resolve(BookingController);
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post('/', this.controller.createBooking);
    this.router.get('/:bookingId', this.controller.getBookingById);
  }
}
