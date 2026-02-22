import { injectable } from 'tsyringe';
import Paystack from 'paystack-node';
import { env } from 'process';

@injectable()
export class PaystackService {
  private paystack: Paystack;

  constructor() {
    this.paystack = new Paystack(process.env['PAYSTACK_SECRET_KEY']!);
  }

  async initializePayment(email: string, amount: number, bookingId: string) {
    try {
      const response = await this.paystack.transaction.initialize({
        email,
        amount: amount * 100, // Amount in kobo
        metadata: {
          bookingId,
        }
      });
      return response.data;
    } catch (error) {
      console.error('Paystack initialization error:', error);
      throw new Error('Failed to initialize payment with Paystack.');
    }
  }

  async verifyPayment(reference: string) {
    try {
      const response = await this.paystack.transaction.verify({ reference });
      return response.data;
    } catch (error) {
      console.error('Paystack verification error:', error);
      throw new Error('Failed to verify payment with Paystack.');
    }
  }
}
