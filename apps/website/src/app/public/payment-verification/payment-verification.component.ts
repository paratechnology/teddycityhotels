import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { baseURL } from '@teddy-city-hotels/shared-interfaces';

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
    const reference =
      this.route.snapshot.queryParamMap.get('reference') ||
      this.route.snapshot.queryParamMap.get('trxref');

    if (reference) {
      this.http.get(`${baseURL}payments/verify?reference=${encodeURIComponent(reference)}`).subscribe({
        next: (res: any) => {
          if (res.status === 'success') {
            const type = res.metadata?.type;

            if (type === 'booking' && res.metadata?.bookingId) {
              this.router.navigate(['/booking-confirmation', res.metadata.bookingId]);
              return;
            }

            if (type === 'snooker_registration') {
              this.router.navigate(['/snooker'], {
                queryParams: { payment: 'success', reference },
              });
              return;
            }

            if (type === 'kitchen_order') {
              this.router.navigate(['/menu'], {
                queryParams: {
                  payment: 'success',
                  orderId: res.metadata?.orderId,
                  reference,
                },
              });
              return;
            }

            if (type === 'swimming_booking') {
              this.router.navigate(['/swimming'], {
                queryParams: {
                  payment: 'success',
                  bookingId: res.metadata?.bookingId,
                  reference,
                },
              });
              return;
            }

            this.router.navigate(['/']);
            return;
          }

          const type = res.metadata?.type;
          if (type === 'snooker_registration') {
            this.router.navigate(['/snooker'], {
              queryParams: { payment: 'failed', reference },
            });
            return;
          }

          if (type === 'kitchen_order') {
            this.router.navigate(['/menu'], {
              queryParams: {
                payment: 'failed',
                orderId: res.metadata?.orderId,
                reference,
              },
            });
            return;
          }

          if (type === 'swimming_booking') {
            this.router.navigate(['/swimming'], {
              queryParams: {
                payment: 'failed',
                bookingId: res.metadata?.bookingId,
                reference,
              },
            });
            return;
          }

          this.router.navigate(['/']);
        },
        error: () => {
          this.router.navigate(['/']);
        },
      });
      return;
    }

    this.router.navigate(['/']);
  }
}
