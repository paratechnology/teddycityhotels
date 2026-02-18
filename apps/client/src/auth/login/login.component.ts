import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonContent,
  IonInput,
  IonButton,
  IonSpinner,
  IonIcon,
  IonLabel,
} from '@ionic/angular/standalone';
import { AuthService } from '../../app/core/services/auth.service';
import { catchError, filter, finalize, switchMap, take, timeout } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import {
  lockClosedOutline,
  mailOutline,
  eyeOutline,
  eyeOffOutline,
  warningOutline,
  alertCircle,
  arrowForward,
} from 'ionicons/icons';
import { throwError } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'], // Updated to local style
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    IonContent,
    IonInput,
    IonButton,
    IonSpinner,
    IonIcon,
    IonLabel,
  ],
})
export class LoginComponent {
  private readonly REMEMBERED_EMAIL_KEY = 'remembered_email';

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup;
  loading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);

  constructor() {
    addIcons({
      lockClosedOutline,
      mailOutline,
      eyeOutline,
      eyeOffOutline,
      warningOutline,
      alertCircle,
      arrowForward
    });

    const rememberedEmail =
      localStorage.getItem(this.REMEMBERED_EMAIL_KEY) || '';

    this.loginForm = this.fb.group({
      email: [rememberedEmail, [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [!!rememberedEmail],
    });
  }

  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }

  login() {
    if (this.loginForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set('');

    const { email, password, rememberMe } = this.loginForm.value;

    if (rememberMe) {
      localStorage.setItem(this.REMEMBERED_EMAIL_KEY, email);
    } else {
      localStorage.removeItem(this.REMEMBERED_EMAIL_KEY);
    }

    const PROFILE_TIMEOUT_MS = 15000; // 15s (realistic for mobile + cold start)

    this.authService
      .login({ email, password })
      .pipe(
        // wait for profile
        switchMap(() =>
          this.authService.currentUserProfile$.pipe(
            filter(Boolean), // only real users
            take(1), // first valid profile only
            timeout(PROFILE_TIMEOUT_MS)
          )
        ),

        finalize(() => this.loading.set(false)),

        catchError((err) => {
          // convert timeout into friendly error
          if (err.name === 'TimeoutError') {
            return throwError(
              () =>
                new Error(
                  'Login taking too long. Please check your connection and try again.'
                )
            );
          }
          return throwError(() => err);
        })
      )
      .subscribe({
        next: () => this.router.navigate(['/app/dashboard']),
        error: (err: any) => this.handleLoginError(err),
      });
  }

private handleLoginError(err: any) {
  if (err.code) {
    switch (err.code) {
      case 'auth/email-not-verified':
        this.errorMessage.set('Please verify your email before logging in.');
        break;

      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        this.errorMessage.set('Invalid email or password.');
        break;

      case 'auth/too-many-requests':
        this.errorMessage.set('Too many failed login attempts. Please try again later.');
        break;

      default:
        this.errorMessage.set('An unexpected error occurred during login.');
    }
  } else {
    this.errorMessage.set(err.message || 'An unexpected error occurred.');
  }
}

}
