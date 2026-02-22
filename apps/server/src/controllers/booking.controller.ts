import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { BookingService } from '../services/booking.service';

@injectable()
export class BookingController {
  constructor(@inject(BookingService) private bookingService: BookingService) {}

  public createBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const booking = await this.bookingService.createBooking(req.body, req.user);
      res.status(201).json(booking);
    } catch (error) {
      next(error);
    }
  };

  public getBookingById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { bookingId } = req.params;
      const booking = await this.bookingService.getBookingById(bookingId);
      res.status(200).json(booking);
    } catch (error) {
      next(error);
    }
  };
}
