import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonContent, IonItem, IonInput,
  IonButton, IonSpinner, IonIcon, IonLabel 
} from '@ionic/angular/standalone';
import { AuthService } from '../../app/core/services/auth.service';
import { finalize } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import { mailOutline, lockClosedOutline, checkmarkCircle, alertCircle, arrowBack, refresh } from 'ionicons/icons';

type ResetStep = 'request' | 'reset';
type MessageType = 'success' | 'error';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule, IonContent,
    IonItem, IonInput, IonButton, IonSpinner, IonIcon, IonLabel
  ],
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  public currentStep = signal<ResetStep>('request');
  public isSubmitting = signal(false);
  public message = signal('');
  public messageType = signal<MessageType>('success');

  public requestForm: FormGroup;
  public resetForm: FormGroup;

  constructor() {
    // Add new icons needed for the premium UI
    addIcons({ mailOutline, lockClosedOutline, checkmarkCircle, alertCircle, arrowBack, refresh });

    this.requestForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    this.resetForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    }, { validators: this.passwordsMatchValidator });
  }

  passwordsMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  requestResetCode() {
    if (this.requestForm.invalid) return;

    this.isSubmitting.set(true);
    this.message.set('');

    this.authService.requestPasswordReset(this.requestForm.value.email).pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: () => {
        this.currentStep.set('reset');
      },
      error: (err) => {
        this.message.set(err.error?.message || 'An unexpected error occurred.');
        this.messageType.set('error');
      }
    });
  }

  resetPassword() {
    if (this.resetForm.invalid) return;

    this.isSubmitting.set(true);
    this.message.set('');

    const payload = {
      email: this.requestForm.value.email,
      code: this.resetForm.value.code,
      newPassword: this.resetForm.value.password
    };

    this.authService.resetPasswordWithCode(payload).pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: (res) => {
        this.message.set(res.message);
        this.messageType.set('success');
      },
      error: (err) => {
        this.message.set(err.error?.message || 'Failed to reset password.');
        this.messageType.set('error');
      }
    });
  }

  goBack() {
    this.currentStep.set('request');
    this.message.set('');
    this.resetForm.reset();
  }
}