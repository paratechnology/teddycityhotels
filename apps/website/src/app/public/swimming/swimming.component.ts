import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  ICreateSwimmingBookingDto,
  IProperty,
  ISwimmingOffer,
  SwimmingBookingType,
  SwimmingPaymentMethod,
} from '@teddy-city-hotels/shared-interfaces';
import { finalize, startWith } from 'rxjs';
import { PublicSwimmingService } from './swimming.service';
import { PropertyContextService } from '../properties/property-context.service';

type StatusBanner = {
  tone: 'success' | 'error' | 'info';
  title: string;
  message: string;
};

@Component({
  selector: 'app-swimming',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './swimming.component.html',
  styleUrls: ['./swimming.component.scss'],
})
export class SwimmingComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private swimmingService = inject(PublicSwimmingService);
  private propertyContext = inject(PropertyContextService);

  property: IProperty | null = null;

  readonly form = this.fb.group({
    bookingType: this.fb.nonNullable.control<SwimmingBookingType>('day_pass', {
      validators: [Validators.required],
    }),
    visitDate: ['', [Validators.required]],
    attendees: [1, [Validators.required, Validators.min(1)]],
    customerName: ['', [Validators.required]],
    customerEmail: ['', [Validators.email]],
    customerPhone: [''],
    paymentMethod: this.fb.nonNullable.control<SwimmingPaymentMethod>('online', {
      validators: [Validators.required],
    }),
    note: [''],
  });

  offers: ISwimmingOffer[] = [];
  loading = true;
  submitting = false;
  latestBookingId = '';
  error = '';
  statusBanner: StatusBanner | null = null;
  readonly minDate = new Date().toISOString().slice(0, 10);

  ngOnInit(): void {
    this.propertyContext.active$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((property) => {
        this.property = property;
      });
    this.setupPaymentMethodValidation();
    this.handleQueryState();
    this.loadOffers();
  }

  get selectedOffer(): ISwimmingOffer | undefined {
    return this.offers.find((offer) => offer.type === this.form.controls.bookingType.value);
  }

  get estimatedAmount(): number {
    const offer = this.selectedOffer;
    if (!offer) return 0;
    if (offer.type === 'family_pass') return offer.price;
    return offer.price * Math.max(1, Number(this.form.controls.attendees.value || 1));
  }

  get currentPaymentMethod(): SwimmingPaymentMethod {
    return this.form.controls.paymentMethod.value;
  }

  selectOffer(offer: ISwimmingOffer): void {
    this.form.patchValue({ bookingType: offer.type });
    if (offer.type === 'family_pass') {
      this.form.patchValue({ attendees: 4 });
    }
  }

  setPaymentMethod(paymentMethod: SwimmingPaymentMethod): void {
    this.form.controls.paymentMethod.setValue(paymentMethod);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const visitDate = String(value.visitDate || '').trim();

    if (!visitDate) {
      this.form.controls.visitDate.setErrors({ required: true });
      this.form.controls.visitDate.markAsTouched();
      return;
    }

    const payload: ICreateSwimmingBookingDto = {
      bookingType: value.bookingType,
      visitDate,
      attendees: Number(value.attendees || 1),
      customerName: String(value.customerName || '').trim(),
      customerEmail: String(value.customerEmail || '').trim() || undefined,
      customerPhone: String(value.customerPhone || '').trim() || undefined,
      paymentMethod: value.paymentMethod,
      note: String(value.note || '').trim() || undefined,
      source: 'website',
      callbackUrl:
        typeof window !== 'undefined'
          ? `${window.location.origin}/payment-verification`
          : undefined,
    };

    this.submitting = true;
    this.error = '';
    this.statusBanner = {
      tone: 'info',
      title: 'Submitting swimming booking',
      message:
        payload.paymentMethod === 'online'
          ? 'We are preparing your payment redirect.'
          : 'We are recording your reservation for admin confirmation.',
    };

    this.swimmingService
      .createBooking(payload)
      .pipe(
        finalize(() => {
          this.submitting = false;
        })
      )
      .subscribe({
        next: (response) => {
          if (response.paymentData?.authorization_url) {
            window.location.assign(response.paymentData.authorization_url);
            return;
          }

          this.latestBookingId = response.booking.id;
          this.statusBanner = {
            tone: 'success',
            title: 'Swimming booking received',
            message: `Booking ${response.booking.id} has been recorded. An admin can confirm cash payment and attendance from the back office.`,
          };
          this.form.patchValue({
            bookingType: 'day_pass',
            visitDate: '',
            attendees: 1,
            customerName: '',
            customerEmail: '',
            customerPhone: '',
            paymentMethod: 'cash',
            note: '',
          });
        },
        error: (error) => {
          this.error = error?.error?.message || 'We could not create the swimming booking.';
          this.statusBanner = {
            tone: 'error',
            title: 'Swimming booking failed',
            message: this.error,
          };
        },
      });
  }

  trackOffer(_index: number, offer: ISwimmingOffer): string {
    return offer.type;
  }

  private loadOffers(): void {
    this.loading = true;
    this.swimmingService
      .getOffers()
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (offers) => {
          this.offers = offers;
          if (!offers.length) {
            this.statusBanner = {
              tone: 'info',
              title: 'Swimming offers are being updated',
              message: 'Please check back shortly for refreshed swimming packages.',
            };
          }
        },
        error: (error) => {
          this.error = error?.error?.message || 'Failed to load swimming offers.';
          this.statusBanner = {
            tone: 'error',
            title: 'Swimming offers unavailable',
            message: this.error,
          };
        },
      });
  }

  private handleQueryState(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const payment = params.get('payment');
      const bookingId = params.get('bookingId');
      const reference = params.get('reference');

      if (payment === 'success') {
        this.latestBookingId = bookingId || '';
        this.statusBanner = {
          tone: 'success',
          title: 'Swimming payment confirmed',
          message: bookingId
            ? `Payment for swimming booking ${bookingId} has been confirmed.`
            : 'Your swimming payment has been confirmed.',
        };
        return;
      }

      if (payment === 'failed') {
        this.statusBanner = {
          tone: 'error',
          title: 'Swimming payment not confirmed',
          message: reference
            ? `Reference ${reference} was not confirmed. You can submit the booking again when ready.`
            : 'Your payment was not confirmed. Please try again.',
        };
      }
    });
  }

  private setupPaymentMethodValidation(): void {
    const emailControl = this.form.controls.customerEmail;
    this.form.controls.paymentMethod.valueChanges
      .pipe(startWith(this.form.controls.paymentMethod.value), takeUntilDestroyed(this.destroyRef))
      .subscribe((paymentMethod) => {
        if (paymentMethod === 'online') {
          emailControl.setValidators([Validators.required, Validators.email]);
        } else {
          emailControl.setValidators([Validators.email]);
        }
        emailControl.updateValueAndValidity({ emitEvent: false });
      });
  }
}
