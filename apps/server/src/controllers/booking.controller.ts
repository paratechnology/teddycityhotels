import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { BookingService } from '../services/booking.service';
import { BookingStatus, CreateBookingDto, UpdateBookingStatusDto } from '@teddy-city-hotels/shared-interfaces';

@injectable()
export class BookingController {
  constructor(@inject(BookingService) private bookingService: BookingService) {}

  public createBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const booking = await this.bookingService.createBooking(req.body as CreateBookingDto, {
        email: req.user?.email,
        id: req.user?.id,
      });
      res.status(201).json(booking);
    } catch (error) {
      next(error);
    }
  };

  public createAdminBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const booking = await this.bookingService.createAdminBooking(req.body as CreateBookingDto, req.user!.id);
      res.status(201).json(booking);
    } catch (error) {
      next(error);
    }
  };

  public getAllBookings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = req.query['status'] as BookingStatus | undefined;
      const roomId = req.query['roomId'] as string | undefined;
      const pageQuery = req.query['page'];
      const pageSizeQuery = req.query['pageSize'];
      const search = req.query['search'] as string | undefined;

      if (pageQuery !== undefined || pageSizeQuery !== undefined || search !== undefined) {
        const page = Number(pageQuery || 1);
        const pageSize = Number(pageSizeQuery || 12);
        const bookings = await this.bookingService.getBookingsPaginated({
          status,
          roomId,
          search,
          page,
          pageSize,
        });
        res.status(200).json(bookings);
        return;
      }

      const bookings = await this.bookingService.getAllBookings({ status, roomId });
      res.status(200).json(bookings);
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

  public updateBookingStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { bookingId } = req.params;
      const { status } = req.body as UpdateBookingStatusDto;
      const booking = await this.bookingService.updateBookingStatus(bookingId, status);
      res.status(200).json(booking);
    } catch (error) {
      next(error);
    }
  };
}
