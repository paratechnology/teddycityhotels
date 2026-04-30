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
 * Route shape:
 *   /                          → corporate (group) home
 *   /properties                → portfolio index
 *   /properties/:slug          → property home (re-uses existing single-hotel sections,
 *                                feature-flagged from IProperty)
 *   /properties/:slug/rooms    → rooms / booking / menu / snooker / swimming / contact
 *
 * Old top-level paths (/rooms, /menu, /snooker, ...) redirect to the default property
 * (Teddy City Enugu) so existing inbound links keep working. Once external links are
 * updated they can be retired.
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
    path: 'management',
    component: ManagementComponent,
  },
  {
    path: 'properties',
    component: PropertiesIndexComponent,
  },
  {
    path: 'properties/:slug',
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

  // Booking confirmation / payment verification stay top-level (not property-scoped).
  { path: 'booking-confirmation/:bookingId', component: BookingConfirmationComponent },
  { path: 'payment-verification', component: PaymentVerificationComponent },

  // Legacy single-hotel paths → redirect to the default property.
  { path: 'rooms', redirectTo: `properties/${DEFAULT_PROPERTY_SLUG}/rooms`, pathMatch: 'full' },
  { path: 'booking/:roomId', redirectTo: `properties/${DEFAULT_PROPERTY_SLUG}/booking/:roomId`, pathMatch: 'full' },
  { path: 'menu', redirectTo: `properties/${DEFAULT_PROPERTY_SLUG}/menu`, pathMatch: 'full' },
  { path: 'snooker', redirectTo: `properties/${DEFAULT_PROPERTY_SLUG}/snooker`, pathMatch: 'full' },
  { path: 'swimming', redirectTo: `properties/${DEFAULT_PROPERTY_SLUG}/swimming`, pathMatch: 'full' },
  { path: 'contact', redirectTo: `properties/${DEFAULT_PROPERTY_SLUG}/contact`, pathMatch: 'full' },

  { path: '**', component: NotFoundComponent },
];
