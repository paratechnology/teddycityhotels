import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { moduleGuard } from './guards/module.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard, moduleGuard],
    data: { module: 'dashboard' },
    loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'rooms',
    canActivate: [authGuard, moduleGuard],
    data: { module: 'rooms' },
    loadComponent: () => import('./pages/rooms/rooms.component').then((m) => m.RoomsComponent),
  },
  {
    path: 'rooms/new',
    canActivate: [authGuard, moduleGuard],
    data: { module: 'rooms' },
    loadComponent: () => import('./pages/rooms/room-edit/room-edit.component').then((m) => m.RoomEditComponent),
  },
  {
    path: 'rooms/edit/:id',
    canActivate: [authGuard, moduleGuard],
    data: { module: 'rooms' },
    loadComponent: () => import('./pages/rooms/room-edit/room-edit.component').then((m) => m.RoomEditComponent),
  },
  {
    path: 'bookings',
    canActivate: [authGuard, moduleGuard],
    data: { module: 'bookings' },
    loadComponent: () => import('./pages/bookings/bookings.component').then((m) => m.BookingsComponent),
  },
  {
    path: 'snooker',
    canActivate: [authGuard, moduleGuard],
    data: { module: 'snooker' },
    loadComponent: () => import('./pages/snooker/snooker.component').then((m) => m.SnookerComponent),
  },
  {
    path: 'financials',
    canActivate: [authGuard, moduleGuard],
    data: { module: 'financials' },
    loadComponent: () => import('./pages/financials/financials.component').then((m) => m.FinancialsComponent),
  },
  {
    path: 'revenue',
    canActivate: [authGuard, moduleGuard],
    data: { module: 'financials' },
    loadComponent: () => import('./pages/revenue/revenue.component').then((m) => m.RevenueComponent),
  },
  {
    path: 'swimming',
    canActivate: [authGuard, moduleGuard],
    data: { module: 'financials' },
    loadComponent: () => import('./pages/swimming/swimming.component').then((m) => m.SwimmingAdminComponent),
  },
  {
    path: 'kitchen',
    canActivate: [authGuard, moduleGuard],
    data: { module: 'kitchen' },
    loadComponent: () => import('./pages/kitchen/kitchen.component').then((m) => m.KitchenComponent),
  },
  {
    path: 'admins',
    canActivate: [authGuard, moduleGuard],
    data: { module: 'admins' },
    loadComponent: () => import('./pages/admins/admins.component').then((m) => m.AdminsComponent),
  },
  {
    path: 'notifications',
    canActivate: [authGuard, moduleGuard],
    data: { module: 'notifications' },
    loadComponent: () => import('./pages/notifications/notifications.component').then((m) => m.NotificationsComponent),
  },
  {
    path: 'access-required',
    loadComponent: () => import('./pages/access-required/access-required.component').then((m) => m.AccessRequiredComponent),
  },
  {
    path: 'forbidden',
    loadComponent: () => import('./pages/forbidden/forbidden.component').then((m) => m.ForbiddenComponent),
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
