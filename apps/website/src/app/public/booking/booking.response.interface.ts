import { Booking, IPaymentInitializationData } from '@teddy-city-hotels/shared-interfaces';

export interface BookingResponse {
  booking: Booking;
  paymentData?: IPaymentInitializationData;
}
