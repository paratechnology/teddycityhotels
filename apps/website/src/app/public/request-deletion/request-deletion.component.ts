import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-request-deletion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './request-deletion.component.html',
  styles: [`
    .container { max-width: 480px; margin: 80px auto; padding: 20px; }
    .card { background: white; padding: 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #eee; }
    h1 { font-size: 24px; margin-bottom: 16px; color: #1f2937; }
    p { color: #6b7280; margin-bottom: 24px; line-height: 1.5; }
    input { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; margin-bottom: 16px; font-size: 16px; }
    button { width: 100%; padding: 12px; background: #dc2626; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
    button:disabled { opacity: 0.7; cursor: not-allowed; }
    .success-box { background: #ecfdf5; color: #065f46; padding: 16px; border-radius: 8px; text-align: center; }
  `]
})
export class RequestDeletionComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  isSubmitted = signal(false);
  isLoading = signal(false);

  submit() {
    if (this.form.invalid) return;
    
    this.isLoading.set(true);
    const email = this.form.get('email')?.value!;

    this.authService.requestAccountDeletion(email).subscribe({
      next: () => this.isSubmitted.set(true),
      error: () => this.isSubmitted.set(true) // Security: Always show success message
    });
  }
}