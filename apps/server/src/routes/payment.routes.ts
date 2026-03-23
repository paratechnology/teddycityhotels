import { Router } from 'express';
import { container } from 'tsyringe';
import { PaymentController } from '../controllers/payment.controller';

export class PaymentRoutes {
  public router: Router;
  private controller: PaymentController;

  constructor() {
    this.router = Router();
    this.controller = container.resolve(PaymentController);
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post('/initialize', this.controller.initializePayment);
    this.router.post('/webhook', this.controller.handleWebhook);
    this.router.get('/verify', this.controller.verifyPayment);
    this.router.get('/verify/:reference', this.controller.verifyPayment);
  }
}
