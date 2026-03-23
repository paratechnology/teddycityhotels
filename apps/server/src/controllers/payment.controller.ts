import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { PaystackService } from '../services/paystack.service';
import { BookingService } from '../services/booking.service';
import { KitchenService } from '../services/kitchen.service';
import { SnookerService } from '../services/snooker.service';
import { SwimmingService } from '../services/swimming.service';

@injectable()
export class PaymentController {
  constructor(
    @inject(PaystackService) private paystackService: PaystackService,
    @inject(BookingService) private bookingService: BookingService,
    @inject(KitchenService) private kitchenService: KitchenService,
    @inject(SnookerService) private snookerService: SnookerService,
    @inject(SwimmingService) private swimmingService: SwimmingService
  ) {}

  public initializePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, amount, metadata, callbackUrl } = req.body || {};
      const data = await this.paystackService.initializeTransaction({
        email,
        amount,
        callbackUrl,
        metadata,
      });
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  public verifyPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reference = String(req.params['reference'] || req.query['reference'] || '').trim();
      if (!reference) {
        res.status(400).json({ success: false, message: 'Payment reference is required.' });
        return;
      }

      const data = await this.paystackService.verifyPayment(reference);
      if (data.status === 'success') {
        await this.processSuccessfulPayment(data);
      }

      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  public handleWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const signature = req.headers['x-paystack-signature'];
      const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));

      if (!this.paystackService.isValidWebhookSignature(typeof signature === 'string' ? signature : undefined, rawBody)) {
        res.status(400).json({ success: false, message: 'Invalid Paystack signature.' });
        return;
      }

      const event = JSON.parse(rawBody.toString('utf8'));
      if (event?.event === 'charge.success' && event.data) {
        await this.processSuccessfulPayment(event.data);
      }

      res.status(200).send();
    } catch (error) {
      next(error);
    }
  };

  private async processSuccessfulPayment(transactionData: any): Promise<void> {
    const metadata = transactionData?.metadata || {};
    const type = metadata?.type;

    if (type === 'booking' && metadata.bookingId) {
      const booking = await this.bookingService.getBookingById(metadata.bookingId);
      if (!['confirmed', 'checked_in', 'checked_out'].includes(booking.status)) {
        await this.bookingService.updateBookingStatus(metadata.bookingId, 'confirmed');
      }
      return;
    }

    if (type === 'kitchen_order' && metadata.orderId) {
      const order = await this.kitchenService.getOrderById(metadata.orderId);
      if (order.paymentStatus !== 'paid') {
        await this.kitchenService.updateOrderPaymentStatus(metadata.orderId, 'paid');
      }
      return;
    }

    if (type === 'snooker_registration' && metadata.playerId) {
      await this.snookerService.markPlayerPaid(metadata.playerId, transactionData?.reference);
      return;
    }

    if (type === 'swimming_booking' && metadata.bookingId) {
      const booking = await this.swimmingService.getBookingById(metadata.bookingId);
      if (booking.paymentStatus !== 'paid') {
        await this.swimmingService.updatePaymentStatus(metadata.bookingId, 'paid');
      }
    }
  }
}
