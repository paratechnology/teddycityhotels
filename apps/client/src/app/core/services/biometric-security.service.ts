import { Injectable, inject } from '@angular/core';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { ToastController, Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class BiometricSecurityService {
  private toastCtrl = inject(ToastController);
  private platform = inject(Platform);

  /**
   * Verifies user identity via FaceID, Fingerprint, or Device PIN.
   * Returns true if verified, false if failed/cancelled.
   */
  async verifyIdentity(reason: string = "Verify your identity"): Promise<boolean> {
    // 1. Bypass if running in browser (for dev testing)
    if (!this.platform.is('hybrid')) {
      console.warn('Biometrics skipped (Browser Mode)');
      return true; 
    }

    try {
      // 2. Check if hardware is available
      const result = await NativeBiometric.isAvailable();

      if (!result.isAvailable) {
        this.showToast('Device security (PIN/Biometrics) is not set up on this device.', 'danger');
        return false;
      }

      // 3. Perform Verification
      await NativeBiometric.verifyIdentity({
        reason: reason,
        title: "Authentication Required",
        subtitle: "Confirm action",
        description: reason,
      });

      // If code reaches here, verification passed
      return true; 

    } catch (error) {
      // User cancelled or failed authentication
      console.error('Biometric error', error);
      return false;
    }
  }

  private async showToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 3000,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }
}