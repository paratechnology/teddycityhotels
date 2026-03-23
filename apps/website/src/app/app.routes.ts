import { Routes } from '@angular/router';
import { PublicContainerComponent } from './public/public-container.component';
import { RoomsComponent } from './public/rooms/rooms.component';
import { BookingConfirmationComponent } from './public/booking-confirmation/booking-confirmation.component';
import { PaymentVerificationComponent } from './public/payment-verification/payment-verification.component';



// --- NEW HOTEL COMPONENTS ---
import { SnookerComponent } from './public/snooker/snooker.component';
import { SwimmingComponent } from './public/swimming/swimming.component';
import { BookingComponent } from './public/booking/booking.component';
import { MenuComponent } from './public/menu/menu.component';
import { ContactComponent } from './public/contact/contact.component';
import { NotFoundComponent } from './public/not-found/not-found.component';

export const routes: Routes = [
  {
    path: '',
    component: PublicContainerComponent
  },
  {
    path: 'rooms',
    component: RoomsComponent
  },
  {
    path: 'booking/:roomId',
    component: BookingComponent
  },
  {
    path: 'booking-confirmation/:bookingId',
    component: BookingConfirmationComponent
  },
  {
    path: 'payment-verification',
    component: PaymentVerificationComponent
  },
  {
    path: 'menu',
    component: MenuComponent
  },
  {
    path: 'contact',
    component: ContactComponent
  },

  // --- HOTEL ROUTES ---
  {
    path: 'snooker',
    component: SnookerComponent
  },
  {
    path: 'swimming',
    component: SwimmingComponent
  },
  
  {
    path: '**',
    component: NotFoundComponent
  }
];
