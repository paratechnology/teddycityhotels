import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-confirm-deletion',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './confirm-deletion.component.html',
  styles: [`
    .container { max-width: 480px; margin: 80px auto; padding: 20px; }
    .card { background: white; padding: 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #eee; text-align: center; }
    h1 { font-size: 24px; margin-bottom: 16px; color: #dc2626; }
    p { color: #4b5563; margin-bottom: 24px; line-height: 1.5; }
    .warning { background: #fef2f2; color: #991b1b; padding: 12px; border-radius: 8px; margin-bottom: 24px; font-size: 0.9rem; }
    .btn-danger { width: 100%; padding: 12px; background: #dc2626; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-danger:disabled { opacity: 0.5; }
    .error { color: #dc2626; margin-top: 16px; }
  `]
})
export class ConfirmDeletionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private router = inject(Router);

  token = signal<string | null>(null);
  status = signal<'idle' | 'processing' | 'success' | 'error'>('idle');
  errorMessage = signal('');

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token.set(params['token']);
      if (!this.token()) {
        this.status.set('error');
        this.errorMessage.set('Invalid or missing deletion token.');
      }
    });
  }

  confirmDelete() {
    if (!this.token()) return;
    
    if (!confirm('FINAL WARNING: This will permanently erase all data. Are you absolutely sure?')) {
      return;
    }

    this.status.set('processing');
    
    this.authService.confirmAccountDeletion(this.token()!).subscribe({
      next: () => {
        this.status.set('success');
      },
      error: (err) => {
        this.status.set('error');
        this.errorMessage.set(err.error?.message || 'Failed to delete account. The token may have expired.');
      }
    });
  }
}