import { Request, Response, NextFunction } from 'express';
import { inject, injectable } from 'tsyringe';
import {
  ICreateSwimmingBookingDto,
  IUpdateSwimmingBookingStatusDto,
  IUpdateSwimmingPaymentStatusDto,
  SwimmingBookingStatus,
  SwimmingBookingType,
  SwimmingPaymentMethod,
  SwimmingPaymentStatus,
} from '@teddy-city-hotels/shared-interfaces';
import { SwimmingService } from '../services/swimming.service';

@injectable()
export class SwimmingController {
  constructor(@inject(SwimmingService) private swimmingService: SwimmingService) {}

  listOffers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json(this.swimmingService.listOffers());
    } catch (error) {
      next(error);
    }
  };

  createBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const row = await this.swimmingService.createBooking(req.body as ICreateSwimmingBookingDto);
      res.status(201).json(row);
    } catch (error) {
      next(error);
    }
  };

  listBookings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Number(req.query['page'] || 1);
      const pageSize = Number(req.query['pageSize'] || 12);
      const search = req.query['search'] as string | undefined;
      const bookingType = req.query['bookingType'] as SwimmingBookingType | undefined;
      const status = req.query['status'] as SwimmingBookingStatus | undefined;
      const paymentStatus = req.query['paymentStatus'] as SwimmingPaymentStatus | undefined;
      const paymentMethod = req.query['paymentMethod'] as SwimmingPaymentMethod | undefined;

      const rows = await this.swimmingService.listBookings({
        page,
        pageSize,
        search,
        bookingType,
        status,
        paymentStatus,
        paymentMethod,
      });
      res.status(200).json(rows);
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = req.body as IUpdateSwimmingBookingStatusDto;
      const row = await this.swimmingService.updateStatus(req.params['bookingId'], payload.status);
      res.status(200).json(row);
    } catch (error) {
      next(error);
    }
  };

  updatePaymentStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = req.body as IUpdateSwimmingPaymentStatusDto;
      const row = await this.swimmingService.updatePaymentStatus(
        req.params['bookingId'],
        payload.paymentStatus
      );
      res.status(200).json(row);
    } catch (error) {
      next(error);
    }
  };
}
