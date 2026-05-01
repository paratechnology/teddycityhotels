import { Routes } from '@angular/router';
import { PublicContainerComponent } from './public/public-container.component';
import { RoomsComponent } from './public/rooms/rooms.component';
import { BookingConfirmationComponent } from './public/booking-confirmation/booking-confirmation.component';
import { PaymentVerificationComponent } from './public/payment-verification/payment-verification.component';
import { SnookerComponent } from './public/snooker/snooker.component';
import { SwimmingComponent } from './public/swimming/swimming.component';
import { BookingComponent } from './public/booking/booking.component';
import { MenuComponent } from './public/menu/menu.component';
import { ContactComponent } from './public/contact/contact.component';
import { NotFoundComponent } from './public/not-found/not-found.component';

import { PropertyShellComponent } from './public/properties/property-shell/property-shell.component';
import { PropertyHomeComponent } from './public/properties/property-home/property-home.component';
import { PropertiesIndexComponent } from './public/properties/properties-index/properties-index.component';
import { propertyResolver } from './public/properties/property.resolver';
import { DEFAULT_PROPERTY_SLUG } from './public/properties/properties.tokens';
import { AboutComponent } from './public/about/about.component';
import { ManagementComponent } from './public/management/management.component';

/**
 * Public route shape:
 *   /                                 corporate (group) home
 *   /hotels                           portfolio index
 *   /hotels/:slug                     hotel home (feature-flagged from IProperty)
 *   /hotels/:slug/{rooms,booking,menu,snooker,swimming,contact}
 *   /about                            group story
 *   /become-a-teddy-city-hotel        owner pitch (formerly /management)
 *
 * Internal code keeps the IProperty entity name; only the user-facing URL
 * vocabulary uses "hotel". Old paths redirect.
 */
export const routes: Routes = [
  {
    path: '',
    component: PublicContainerComponent,
  },
  {
    path: 'about',
    component: AboutComponent,
  },
  {
    path: 'become-a-teddy-city-hotel',
    component: ManagementComponent,
  },
  {
    path: 'hotels',
    component: PropertiesIndexComponent,
  },
  {
    path: 'hotels/:slug',
    component: PropertyShellComponent,
    resolve: { property: propertyResolver },
    children: [
      { path: '', component: PropertyHomeComponent, pathMatch: 'full' },
      { path: 'rooms', component: RoomsComponent },
      { path: 'booking/:roomId', component: BookingComponent },
      { path: 'menu', component: MenuComponent },
      { path: 'snooker', component: SnookerComponent },
      { path: 'swimming', component: SwimmingComponent },
      { path: 'contact', component: ContactComponent },
    ],
  },

  // Top-level (not hotel-scoped)
  { path: 'booking-confirmation/:bookingId', component: BookingConfirmationComponent },
  { path: 'payment-verification', component: PaymentVerificationComponent },

  // Legacy URL redirects → the new vocabulary / default hotel
  { path: 'management', redirectTo: 'become-a-teddy-city-hotel', pathMatch: 'full' },
  { path: 'properties', redirectTo: 'hotels', pathMatch: 'full' },
  { path: 'properties/:slug', redirectTo: 'hotels/:slug', pathMatch: 'full' },

  // Old single-hotel flat paths → default hotel under the new scope
  { path: 'rooms', redirectTo: `hotels/${DEFAULT_PROPERTY_SLUG}/rooms`, pathMatch: 'full' },
  { path: 'booking/:roomId', redirectTo: `hotels/${DEFAULT_PROPERTY_SLUG}/booking/:roomId`, pathMatch: 'full' },
  { path: 'menu', redirectTo: `hotels/${DEFAULT_PROPERTY_SLUG}/menu`, pathMatch: 'full' },
  { path: 'snooker', redirectTo: `hotels/${DEFAULT_PROPERTY_SLUG}/snooker`, pathMatch: 'full' },
  { path: 'swimming', redirectTo: `hotels/${DEFAULT_PROPERTY_SLUG}/swimming`, pathMatch: 'full' },
  { path: 'contact', redirectTo: `hotels/${DEFAULT_PROPERTY_SLUG}/contact`, pathMatch: 'full' },

  { path: '**', component: NotFoundComponent },
];
