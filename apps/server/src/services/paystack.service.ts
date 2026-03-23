import crypto from 'crypto';
import { injectable } from 'tsyringe';
import Paystack from 'paystack-node';
import { IPaymentInitializationData } from '@teddy-city-hotels/shared-interfaces';

type PaymentMetadata =
  | { type: 'booking'; bookingId: string }
  | { type: 'kitchen_order'; orderId: string }
  | { type: 'snooker_registration'; playerId: string; competitionId: string }
  | { type: 'swimming_booking'; bookingId: string; bookingType: string };

type InitializeTransactionInput = {
  email: string;
  amount: number;
  callbackUrl?: string;
  metadata: PaymentMetadata;
};

@injectable()
export class PaystackService {
  private paystack: Paystack;
  private readonly defaultCallbackUrl: string;
  private readonly allowedCallbackHosts: Set<string>;

  constructor() {
    this.paystack = new Paystack(process.env['PAYSTACK_SECRET_KEY']!);
    this.defaultCallbackUrl = this.resolveDefaultCallbackUrl();
    this.allowedCallbackHosts = this.buildAllowedCallbackHosts();
  }

  private resolveDefaultCallbackUrl(): string {
    const frontendUrl = String(process.env['FRONTEND_URL'] || '').trim().replace(/\/+$/, '');
    if (frontendUrl) {
      return `${frontendUrl}/payment-verification`;
    }
    return 'http://localhost:4200/payment-verification';
  }

  private buildAllowedCallbackHosts(): Set<string> {
    const hosts = new Set<string>([
      'teddycityhotels.com',
      'www.teddycityhotels.com',
      'teddycityhotels1.web.app',
      'www.teddycityhotels1.web.app',
      'localhost',
      '127.0.0.1',
    ]);

    try {
      const fallbackHost = new URL(this.defaultCallbackUrl).hostname.toLowerCase();
      hosts.add(fallbackHost);
    } catch {
      // Ignore malformed fallback URL; a later parse will still fall back safely.
    }

    return hosts;
  }

  private resolveCallbackUrl(candidate?: string): string {
    const fallback = this.defaultCallbackUrl;
    const raw = String(candidate || '').trim();
    if (!raw) return fallback;

    try {
      const parsed = new URL(raw);
      const hostname = parsed.hostname.toLowerCase();
      const allowedHost = this.allowedCallbackHosts.has(hostname);
      const validPath = parsed.pathname === '/payment-verification';
      const secureProtocol = parsed.protocol === 'https:';
      const localHttp = (hostname === 'localhost' || hostname === '127.0.0.1') && parsed.protocol === 'http:';

      if (allowedHost && validPath && (secureProtocol || localHttp)) {
        return parsed.toString();
      }
    } catch {
      return fallback;
    }

    return fallback;
  }

  async initializeTransaction(input: InitializeTransactionInput): Promise<IPaymentInitializationData> {
    try {
      const response = await this.paystack.transaction.initialize({
        email: input.email,
        amount: Math.round(input.amount * 100),
        callback_url: this.resolveCallbackUrl(input.callbackUrl),
        metadata: input.metadata,
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

  isValidWebhookSignature(signature: string | undefined, rawBody: Buffer): boolean {
    if (!signature) return false;

    const expected = crypto
      .createHmac('sha512', process.env['PAYSTACK_SECRET_KEY']!)
      .update(rawBody)
      .digest('hex');

    const actualBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expected, 'utf8');

    if (actualBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
  }
}
