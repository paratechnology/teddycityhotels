import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'rooms',
    loadComponent: () =>
      import('./pages/rooms/rooms.component').then(
        (m) => m.RoomsComponent
      ),
  },
  {
    path: 'rooms/new',
    loadComponent: () =>
      import('./pages/rooms/room-edit/room-edit.component').then(
        (m) => m.RoomEditComponent
      ),
  },
  {
    path: 'rooms/edit/:id',
    loadComponent: () =>
      import('./pages/rooms/room-edit/room-edit.component').then(
        (m) => m.RoomEditComponent
      ),
  },
  {
    path: 'bookings',
    loadComponent: () =>
      import('./pages/bookings/bookings.component').then(
        (m) => m.BookingsComponent
      ),
  },
  {
    path: 'snooker',
    loadComponent: () =>
      import('./pages/snooker/snooker.component').then(
        (m) => m.SnookerComponent
      ),
  },
  {
    path: 'financials',
    loadComponent: () =>
      import('./pages/financials/financials.component').then(
        (m) => m.FinancialsComponent
      ),
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
];
