import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { finalize, startWith } from 'rxjs';
import {
  ICreateKitchenOrderDto,
  IKitchenMenuItem,
  IProperty,
  KitchenMenuCategory,
  KitchenOrderPaymentMethod,
} from '@teddy-city-hotels/shared-interfaces';
import { PublicKitchenService } from './menu.service';
import { PropertyContextService } from '../properties/property-context.service';

type MenuFilter = 'all' | KitchenMenuCategory;

type CartEntry = {
  item: IKitchenMenuItem;
  quantity: number;
};

type StatusBanner = {
  tone: 'success' | 'error' | 'info';
  eyebrow: string;
  title: string;
  message: string;
};

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
})
export class MenuComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private kitchenService = inject(PublicKitchenService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private propertyContext = inject(PropertyContextService);

  property: IProperty | null = null;

  readonly filters: Array<{ value: MenuFilter; label: string }> = [
    { value: 'all', label: 'All menu' },
    { value: 'food', label: 'Kitchen plates' },
    { value: 'drink', label: 'Drinks' },
  ];

  readonly checkoutForm = this.fb.group({
    customerName: ['', [Validators.required]],
    customerEmail: ['', [Validators.email]],
    customerPhone: [''],
    paymentMethod: this.fb.nonNullable.control<KitchenOrderPaymentMethod>('online', {
      validators: [Validators.required],
    }),
    note: [''],
  });

  menuItems: IKitchenMenuItem[] = [];
  cart: CartEntry[] = [];
  activeFilter: MenuFilter = 'all';
  loading = true;
  submitting = false;
  statusBanner: StatusBanner | null = null;
  latestOrderId: string | null = null;

  ngOnInit(): void {
    this.propertyContext.active$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((property) => {
        this.property = property;
      });
    this.setupPaymentMethodValidation();
    this.handleQueryState();
    this.loadMenu();
  }

  get visibleMenuItems(): IKitchenMenuItem[] {
    const items =
      this.activeFilter === 'all'
        ? this.menuItems
        : this.menuItems.filter((item) => item.category === this.activeFilter);

    return [...items].sort((left, right) => left.name.localeCompare(right.name));
  }

  get cartCount(): number {
    return this.cart.reduce((sum, entry) => sum + entry.quantity, 0);
  }

  get subtotal(): number {
    return this.cart.reduce((sum, entry) => sum + entry.item.price * entry.quantity, 0);
  }

  get currentPaymentMethod(): KitchenOrderPaymentMethod {
    return this.checkoutForm.controls.paymentMethod.value;
  }

  setActiveFilter(filter: MenuFilter): void {
    this.activeFilter = filter;
  }

  getFilterCount(filter: MenuFilter): number {
    if (filter === 'all') {
      return this.menuItems.length;
    }

    return this.menuItems.filter((item) => item.category === filter).length;
  }

  getQuantity(menuItemId: string): number {
    return this.cart.find((entry) => entry.item.id === menuItemId)?.quantity || 0;
  }

  addToCart(item: IKitchenMenuItem): void {
    const existing = this.cart.find((entry) => entry.item.id === item.id);
    this.cart = existing
      ? this.cart.map((entry) =>
          entry.item.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry
        )
      : [...this.cart, { item, quantity: 1 }];

    this.statusBanner = null;
  }

  decreaseQuantity(menuItemId: string): void {
    const existing = this.cart.find((entry) => entry.item.id === menuItemId);
    if (!existing) return;

    if (existing.quantity <= 1) {
      this.removeFromCart(menuItemId);
      return;
    }

    this.cart = this.cart.map((entry) =>
      entry.item.id === menuItemId ? { ...entry, quantity: entry.quantity - 1 } : entry
    );
  }

  increaseQuantity(menuItemId: string): void {
    const existing = this.cart.find((entry) => entry.item.id === menuItemId);
    if (!existing) return;

    this.cart = this.cart.map((entry) =>
      entry.item.id === menuItemId ? { ...entry, quantity: entry.quantity + 1 } : entry
    );
  }

  removeFromCart(menuItemId: string): void {
    this.cart = this.cart.filter((entry) => entry.item.id !== menuItemId);
  }

  setPaymentMethod(paymentMethod: KitchenOrderPaymentMethod): void {
    this.checkoutForm.controls.paymentMethod.setValue(paymentMethod);
  }

  submitOrder(): void {
    if (!this.cart.length) {
      this.statusBanner = {
        tone: 'error',
        eyebrow: 'Cart needed',
        title: 'Add something to the order first',
        message: 'Select one or more menu items before checking out.',
      };
      return;
    }

    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      this.statusBanner = {
        tone: 'error',
        eyebrow: 'Details incomplete',
        title: 'We need a few more customer details',
        message: 'Complete the checkout form so we can process the order correctly.',
      };
      return;
    }

    const formValue = this.checkoutForm.getRawValue();
    const payload: ICreateKitchenOrderDto = {
      customerName: String(formValue.customerName || '').trim(),
      customerEmail: String(formValue.customerEmail || '').trim() || undefined,
      customerPhone: String(formValue.customerPhone || '').trim() || undefined,
      paymentMethod: formValue.paymentMethod,
      items: this.cart.map((entry) => ({
        menuItemId: entry.item.id,
        quantity: entry.quantity,
      })),
      note: String(formValue.note || '').trim() || undefined,
      source: 'website',
      callbackUrl:
        typeof window !== 'undefined'
          ? `${window.location.origin}/payment-verification`
          : undefined,
    };

    this.submitting = true;
    this.statusBanner = {
      tone: 'info',
      eyebrow: 'Submitting order',
      title: `Sending your order to ${this.property?.branding?.displayName || this.property?.name || 'this property'} Kitchen`,
      message:
        payload.paymentMethod === 'online'
          ? 'We are preparing your secure payment redirect.'
          : 'We are logging your cash order now.',
    };

    this.kitchenService
      .createOrder(payload)
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

          this.latestOrderId = response.order.id;
          this.cart = [];
          this.checkoutForm.patchValue({
            customerName: '',
            customerEmail: '',
            customerPhone: '',
            note: '',
            paymentMethod: 'cash',
          });
          this.statusBanner = {
            tone: 'success',
            eyebrow: 'Order placed',
            title: 'Cash order received',
            message: `Order ${response.order.id} has been sent to ${this.property?.branding?.displayName || this.property?.name || 'this property'} Kitchen. An admin can mark it paid once cash is collected.`,
          };
        },
        error: (error) => {
          this.statusBanner = {
            tone: 'error',
            eyebrow: 'Order failed',
            title: 'We could not place the order',
            message:
              error?.error?.message ||
              'Something went wrong while sending the order. Please review the details and try again.',
          };
        },
      });
  }

  trackMenuItem(_index: number, item: IKitchenMenuItem): string {
    return item.id;
  }

  trackCartEntry(_index: number, entry: CartEntry): string {
    return entry.item.id;
  }

  private loadMenu(): void {
    this.loading = true;
    this.kitchenService
      .listMenu()
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (items) => {
          this.menuItems = items;
          if (!items.length) {
            this.statusBanner = {
              tone: 'info',
              eyebrow: 'Menu updating',
              title: 'The kitchen menu is being refreshed',
              message: 'No public menu items are available right now. Please check again shortly.',
            };
          }
        },
        error: () => {
          this.statusBanner = {
            tone: 'error',
            eyebrow: 'Menu unavailable',
            title: 'We could not load the kitchen menu',
            message: 'Please refresh the page or try again in a moment.',
          };
        },
      });
  }

  private handleQueryState(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const payment = params.get('payment');
      const orderId = params.get('orderId');
      const reference = params.get('reference');

      if (payment === 'success') {
        this.latestOrderId = orderId;
        this.cart = [];
        this.statusBanner = {
          tone: 'success',
          eyebrow: 'Payment confirmed',
          title: 'Online order paid successfully',
          message: orderId
            ? `Payment for order ${orderId} has been confirmed. ${this.property?.branding?.displayName || this.property?.name || 'This property'} Kitchen can start processing it now.`
            : 'Your payment has been confirmed and the kitchen has the order.',
        };
        return;
      }

      if (payment === 'failed') {
        this.statusBanner = {
          tone: 'error',
          eyebrow: 'Payment incomplete',
          title: 'The online payment did not complete',
          message: reference
            ? `Reference ${reference} was not confirmed. You can try the order again when ready.`
            : 'Your payment was not confirmed. Please try again.',
        };
      }
    });
  }

  private setupPaymentMethodValidation(): void {
    const emailControl = this.checkoutForm.controls.customerEmail;
    this.checkoutForm.controls.paymentMethod.valueChanges
      .pipe(
        startWith(this.checkoutForm.controls.paymentMethod.value),
        takeUntilDestroyed(this.destroyRef)
      )
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
