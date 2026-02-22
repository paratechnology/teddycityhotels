import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-payment-verification',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: '<p>Verifying payment...</p>',
})
export class PaymentVerificationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);

  ngOnInit(): void {
    const reference = this.route.snapshot.queryParamMap.get('reference');
    if (reference) {
      this.http.get(`/api/payments/verify/${reference}`).subscribe((res: any) => {
        if (res.status === 'success') {
          const bookingId = res.data.metadata.bookingId;
          this.router.navigate(['/booking-confirmation', bookingId]);
        } else {
          // Payment failed
          this.router.navigate(['/']);
        }
      });
    }
  }
}
