import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonInput, IonButton, IonSpinner, IonNote, ToastController } from '@ionic/angular/standalone';
import { catchError, finalize, of } from 'rxjs';
import { InvitationService } from '../../core/services/invitation.service';
import { AuthService } from '../../core/services/auth.service';
import { IAcceptInvitation } from '@quickprolaw/shared-interfaces';

type PageStatus = 'loadingToken' | 'valid' | 'invalidToken' ;

@Component({
  selector: 'app-accept-invitation',
  templateUrl: './accept-invitation.page.html',
  styleUrls: ['./accept-invitation.page.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonInput, IonButton, IonSpinner, IonNote]
})
export class AcceptInvitationPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private invitationService = inject(InvitationService);
  private authService = inject(AuthService);
  private toastCtrl = inject(ToastController);

  public pageStatus = signal<PageStatus>('loadingToken');
  public errorMessage = signal<string>('');
  public invitationEmail = signal<string>('');
  public userDesignation = signal<string | null>(null);

  public isSubmitting = signal<boolean>(false);
  public registrationForm!: FormGroup;
  private token: string | null = null;
  private firmId: string | null = null;

  ngOnInit() {
    // Invitations links use query parameters: ?firmId=...&token=...
    this.firmId = this.route.snapshot.queryParamMap.get('firmId');
    this.token = this.route.snapshot.queryParamMap.get('token');

    if (!this.token || !this.firmId) {
      this.pageStatus.set('invalidToken');
      this.errorMessage.set('Invalid invitation link. Please check the URL and try again.');
      return;
    }

    this.invitationService.verifyToken(this.firmId, this.token).pipe(
      catchError(err => {
        this.pageStatus.set('invalidToken');
        this.errorMessage.set(err.error?.message || 'This invitation is invalid or has expired.');
        return of(null);
      })
    ).subscribe(invitation => {
      if (invitation) {
        this.invitationEmail.set(invitation.email);
        this.userDesignation.set(invitation.designation);
        // The firmId is now implicitly verified and stored in the component state
        this.initializeForm();
        this.pageStatus.set('valid');
      }
    });
  }

  initializeForm() {
    this.registrationForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }


  submitRegistration() {
    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.registrationForm.value;

    const dto: IAcceptInvitation = {
      token: this.token!,
      firmId: this.firmId!,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      password: formValue.password,
    };

    this.authService.acceptInvitation(dto).pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: () => {
        this.router.navigate(['/app/tasks']); // Success! Navigate into the app.
      },
      error: async (err) => {
        const message = err.error?.message || 'Registration failed. Please try again.';
        const toast = await this.toastCtrl.create({ message, duration: 4000, color: 'danger' });
        toast.present();
      }
    });
  }

  private passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    return password && confirmPassword && password.value !== confirmPassword.value
      ? { passwordMismatch: true }
      : null;
  };
}