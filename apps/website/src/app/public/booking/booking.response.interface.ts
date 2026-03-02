import { Booking } from '@teddy-city-hotels/shared-interfaces';

export interface BookingResponse {
  booking: Booking;
  paymentData?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}
