import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonInput, IonButton, IonIcon, IonList, IonNote, IonCardSubtitle, ToastController, IonListHeader } from '@ionic/angular/standalone';
import { AuthService } from '../../app/core/services/auth.service';
import { finalize } from 'rxjs/operators';
import { IRegisterFirm } from '@quickprolaw/shared-interfaces';
import {addIcons} from 'ionicons';
import { alertCircleOutline, arrowForwardOutline } from 'ionicons/icons';


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [IonListHeader, IonCardSubtitle, CommonModule, RouterLink, ReactiveFormsModule, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonInput, IonButton, IonIcon, IonList, IonNote, IonCardSubtitle]
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private toastCtrl = inject(ToastController);

  step = signal<'firmInfo' | 'adminInfo' | 'verifyEmail'>('firmInfo');
  firmForm: FormGroup;
  adminForm: FormGroup;

  isSubmitting = signal(false);
  errorMessage = signal('');

  constructor() {
    addIcons({alertCircleOutline, arrowForwardOutline});

    this.firmForm = this.fb.group({
      firmName: ['', Validators.required],
    });

    this.adminForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      designation: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  nextStep() {
    if (this.step() === 'firmInfo') {
      if (this.firmForm.invalid) {
        this.firmForm.markAllAsTouched();
        return;
      }
      this.step.set('adminInfo');
    } else if (this.step() === 'adminInfo') {
      if (this.adminForm.invalid) {
        this.adminForm.markAllAsTouched();
        return;
      }
      // Initiate the registration process which will send the verification email
      const dto: IRegisterFirm = {
        firmName: this.firmForm.value.firmName,
        adminFirstName: this.adminForm.value.firstName,
        adminLastName: this.adminForm.value.lastName,
        adminDesignation: this.adminForm.value.designation,
        adminEmail: this.adminForm.value.email,
        adminPassword: this.adminForm.value.password,
      };

      this.isSubmitting.set(true);
      this.authService.initiateRegistration(dto).pipe(
        finalize(() => this.isSubmitting.set(false))
      ).subscribe({
        next: () => {
          this.authService.setPendingRegistration(dto); // Still need this for the final step
          this.step.set('verifyEmail');
        },
        error: (err) => this.errorMessage.set(err.error?.message || 'An unexpected error occurred.')
      });
    }
  }

  async resendVerification() {
    const email = this.adminForm.value.email;
    this.authService.resendVerificationEmail(email).subscribe(async () => {
      const toast = await this.toastCtrl.create({ message: 'Verification email sent.', duration: 3000, color: 'success' });
      await toast.present();
    });
  }

  goBack() {
    if (this.step() === 'adminInfo') {
      this.step.set('firmInfo');
    }
  }

  private passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    return password && confirmPassword && password.value !== confirmPassword.value
      ? { passwordMismatch: true }
      : null;
  };
}
