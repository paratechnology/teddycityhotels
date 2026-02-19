import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { publicGuard } from './core/guards/public.guard';
import { profileCompleteGuard } from './core/guards/profile-complete.guard';

export const routes: Routes = [
  // --- Public Routes (Login, Register, etc.) ---
  {
    path: '',
    canActivate: [publicGuard],
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', loadComponent: () => import('../auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('../auth/register/register.component').then(m => m.RegisterComponent) },
      { path: 'reset-password', loadComponent: () => import('../auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent) },
      { path: 'reset-password/:token', loadComponent: () => import('../auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent) },
      { path: 'accept-invitation', loadComponent: () => import('./pages/accept-invitation/accept-invitation.page').then(m => m.AcceptInvitationPage) },
    ]
  },

  // --- Authenticated App Routes ---
  {
    path: 'app',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      
      // Core Dashboard
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardComponent),
        canActivate: [profileCompleteGuard]
      },

      // User Profile & Account Settings
      {
        path: 'profile',
        loadComponent: () => import('./pages/my-account/my-profile/my-profile.component').then(m => m.MyProfileComponent)
      },

    ],
  },
  
  // Fallback
  { path: '**', redirectTo: 'login', pathMatch: 'full' }
];