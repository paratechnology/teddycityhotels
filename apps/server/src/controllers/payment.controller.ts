import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { PaystackService } from '../services/paystack.service';
import { BookingService } from '../services/booking.service';

@injectable()
export class PaymentController {
  constructor(
    @inject(PaystackService) private paystackService: PaystackService,
    @inject(BookingService) private bookingService: BookingService,
  ) {}

  public initializePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, amount, bookingId } = req.body;
      const data = await this.paystackService.initializePayment(email, amount, bookingId);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  public verifyPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reference } = req.params;
      const data = await this.paystackService.verifyPayment(reference);
      if (data.status === 'success') {
        const bookingId = data.metadata.bookingId;
        await this.bookingService.updateBookingStatus(bookingId, 'confirmed');
      }
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };
}
