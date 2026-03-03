import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AdminSessionService } from '../../core/admin-session.service';

type AuthView = 'login' | 'request-reset' | 'confirm-reset';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  view: AuthView = 'login';
  form: FormGroup;
  requestResetForm: FormGroup;
  resetForm: FormGroup;
  loading = false;
  error = '';
  info = '';
  resetEmail = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private session: AdminSessionService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.requestResetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    this.resetForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    if (this.session.token) {
      this.session.refreshProfile().subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: () => this.session.clearSession(),
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.view = 'login';
    this.loading = true;
    this.error = '';
    this.info = '';

    const { email, password } = this.form.getRawValue();
    this.authService.adminLogin(email, password).subscribe({
      next: ({ token }) => {
        localStorage.setItem('token', token);
        this.session.refreshProfile().subscribe({
          next: () => {
            this.loading = false;
            this.router.navigate(['/dashboard']);
          },
          error: (error) => {
            this.loading = false;
            this.session.clearSession();
            this.error = error?.error?.message || 'Login succeeded, but profile loading failed.';
          },
        });
      },
      error: (error) => {
        this.loading = false;
        this.error = error?.error?.message || 'Login failed. Please check your credentials.';
      },
    });
  }

  startResetFlow(): void {
    this.view = 'request-reset';
    this.error = '';
    this.info = '';
    this.loading = false;

    const email = this.form.get('email')?.value;
    if (email) {
      this.requestResetForm.patchValue({ email });
    }
  }

  backToLogin(): void {
    this.view = 'login';
    this.loading = false;
    this.error = '';
    this.info = '';
    this.resetForm.reset();
  }

  requestResetCode(): void {
    if (this.requestResetForm.invalid) {
      this.requestResetForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';
    this.info = '';

    const { email } = this.requestResetForm.getRawValue();
    this.authService.requestPasswordReset(email).subscribe({
      next: ({ message }) => {
        this.loading = false;
        this.resetEmail = email;
        this.view = 'confirm-reset';
        this.info =
          message || 'If an account exists, a 6-digit reset code has been sent to your email.';
        this.resetForm.reset();
      },
      error: (error) => {
        this.loading = false;
        this.error = error?.error?.message || 'Could not request password reset. Please try again.';
      },
    });
  }

  submitResetPassword(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const { code, password, confirmPassword } = this.resetForm.getRawValue();
    if (password !== confirmPassword) {
      this.resetForm.get('confirmPassword')?.setErrors({ mismatch: true });
      this.error = 'Passwords do not match.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.info = '';

    this.authService
      .resetPasswordWithCode({
        email: this.resetEmail,
        code,
        newPassword: password,
      })
      .subscribe({
        next: ({ message }) => {
          this.loading = false;
          this.view = 'login';
          this.info = message || 'Password reset successful. Sign in with your new password.';
          this.error = '';
          this.form.patchValue({ email: this.resetEmail, password: '' });
          this.resetForm.reset();
        },
        error: (error) => {
          this.loading = false;
          this.error = error?.error?.message || 'Failed to reset password.';
        },
      });
  }
}
