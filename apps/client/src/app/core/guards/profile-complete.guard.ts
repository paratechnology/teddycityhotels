import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';

export const profileCompleteGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastCtrl = inject(ToastController);

  const isFirstTime = route.queryParamMap.get('firstTime') === 'true';
  const isProfileComplete = !!authService.userProfile()?.picture;

  if (isFirstTime && !isProfileComplete) {
    // router.navigate(['/app/profile']);
    const toast = await toastCtrl.create({ message: 'Please complete your profile first.', duration: 3000, color: 'warning' });
    await toast.present();
    return true; 
  }

  return true; // Allow navigation
};