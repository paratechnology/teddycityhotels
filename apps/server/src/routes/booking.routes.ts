import { Router } from 'express';
import { container } from 'tsyringe';
import { BookingController } from '../controllers/booking.controller';

export class BookingRoutes {
  public router: Router;
  private bookingController: BookingController;

  constructor() {
    this.router = Router();
    this.bookingController = container.resolve(BookingController);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/availability', this.bookingController.getRoomAvailability);
    this.router.post('/', this.bookingController.createBooking);
  }
}
