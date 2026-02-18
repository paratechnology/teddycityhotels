import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { InvitationService, VerifiedInvitation } from '../../core/services/invitation.service';

@Component({
  selector: 'app-accept-invitation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './accept-invitation.component.html',
  styleUrls: ['./accept-invitation.component.scss'],
})
export class AcceptInvitationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private invitationService = inject(InvitationService);
  private authService = inject(AuthService);

  token: string | null = null;
  firmId: string | null = null;
  invitationDetails = signal<VerifiedInvitation | null>(null);
  acceptForm!: FormGroup;
  isSubmitting = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
    this.firmId = this.route.snapshot.queryParamMap.get('firmId');

    this.acceptForm = this.fb.group({
      firstName: ['', Validators.required],
      otherNames: [''],
      lastName: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    if (this.token && this.firmId) {
      this.verifyToken();
    } else {
      this.errorMessage.set('Invalid invitation link. Please check the URL.');
    }
  }

  verifyToken() {
    this.invitationService.verifyToken(this.firmId!, this.token!).subscribe({
      next: (details) => this.invitationDetails.set(details),
      error: (err) => this.errorMessage.set(err.error?.message || 'This invitation is invalid or has expired.')
    });
  }

  onSubmit() {
    if (this.acceptForm.invalid || !this.invitationDetails()) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const dto = {
      token: this.token,
      firmId: this.firmId,
      firstName: this.acceptForm.value.firstName,
      otherNames: this.acceptForm.value.otherNames,
      lastName: this.acceptForm.value.lastName,
      password: this.acceptForm.value.password
    };

    this.authService.acceptInvitation(dto).pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: () => {
        this.successMessage.set('Registration successful! You can now log in using the mobile or desktop app.');
      },
      error: (err) => this.errorMessage.set(err.error?.message || 'An unexpected error occurred during registration.')
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
