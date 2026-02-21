import { Routes } from '@angular/router';
import { PublicContainerComponent } from './public/public-container.component';
import { RoomsComponent } from './public/rooms/rooms.component';



// --- NEW HOTEL COMPONENTS ---
import { SnookerComponent } from './public/snooker/snooker.component';
import { SwimmingComponent } from './public/swimming/swimming.component';
import { BookingComponent } from './public/booking/booking.component';

export const routes: Routes = [
  {
    path: '',
    component: PublicContainerComponent
  },
  {
    path: 'rooms',
    component: RoomsComponent
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
    path: 'booking',
    component: BookingComponent
  },
  
 // Fallback route 
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
