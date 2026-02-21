import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonSpinner, IonIcon, IonCardSubtitle, ToastController } from '@ionic/angular/standalone';
import { AuthService } from '../../app/core/services/auth.service';
import { finalize } from 'rxjs/operators';
import { IRegisterFirm } from '@teddy-city-hotels/shared-interfaces';

@Component({
  selector: 'app-registration-complete',
  templateUrl: './registration-complete.component.html',
  styleUrls: ['./registration-complete.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonSpinner, IonCardSubtitle]
})
export class RegistrationCompleteComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastCtrl = inject(ToastController);

  step = signal<'verifying' | 'onboarding' | 'error'>('verifying');
  isSubmitting = signal(false);
  errorMessage = signal('');
  pendingData: IRegisterFirm | null = null;
  
  ngOnInit() {
    // The user arrives here *after* the auth-action component has verified their email.
    // We just need to retrieve the pending data to proceed.
    this.pendingData = this.authService.getPendingRegistration();

    if (!this.pendingData) {
      this.errorMessage.set('Registration session expired or invalid. Please start over.');
      this.step.set('error');
    } else {
      this.step.set('onboarding');
    }
  }

  startTrial() {
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.authService.completeFirmRegistration({ subscriptionType: 'trial' }).pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: () => {
        this.router.navigate(['/app/dashboard']);
      },
      error: (err) => this.errorMessage.set(err.error?.message || 'An unexpected error occurred.')
    });
  }

  async subscribeNow() {
    // console.log('Redirecting to subscription page...');
    const toast = await this.toastCtrl.create({
      message: 'Subscription flow not yet implemented.',
      duration: 3000,
      color: 'medium'
    });
    await toast.present();
  }
}