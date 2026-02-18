import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonSpinner, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton } from '@ionic/angular/standalone';
import { AuthService } from '../../app/core/services/auth.service';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-auth-action',
  standalone: true,
  imports: [IonContent, IonSpinner, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton],
  template: `
    <ion-content class="ion-padding">
      <div class="container">
        <ion-card class="card">
          <ion-card-header class="ion-text-center">
            @switch (status()) {
              @case ('processing') {
                <ion-spinner name="crescent"></ion-spinner>
                <ion-card-title>Processing...</ion-card-title>
              }
              @case ('error') {
                <ion-card-title>An Error Occurred</ion-card-title>
              }
            }
          </ion-card-header>
          @if (status() === 'error') {
            <ion-card-content class="ion-text-center">
              <p>{{ errorMessage() }}</p>
              <ion-button routerLink="/login" expand="block" fill="clear">Return to Login</ion-button>
            </ion-card-content>
          }
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`.container { display: flex; justify-content: center; align-items: center; height: 100%; } .card { max-width: 450px; width: 100%; }`]
})
export class AuthActionComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  status = signal<'processing' | 'error'>('processing');
  errorMessage = signal('');

  ngOnInit() {
    const oobCode = this.route.snapshot.queryParamMap.get('oobCode');
    if (!oobCode) {
      this.errorMessage.set('Invalid action link.');
      this.status.set('error');
      return;
    }

    // Apply the code to verify the email, then immediately navigate to the final onboarding step.
    this.authService.applyActionCode(oobCode).subscribe({
      next: () => this.router.navigate(['/registration-complete']),
      error: (err) => {
        this.errorMessage.set(err.message || 'The action link is invalid or has expired. Please try again.');
        this.status.set('error');
      }
    });
  }
}