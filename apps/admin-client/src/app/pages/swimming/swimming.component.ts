import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ISwimmingBooking,
  ISwimmingOffer,
  SwimmingBookingStatus,
  SwimmingBookingType,
  SwimmingPaymentMethod,
  SwimmingPaymentStatus,
} from '@teddy-city-hotels/shared-interfaces';
import { SwimmingAdminService } from '../../services/swimming.service';

@Component({
  selector: 'app-swimming-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './swimming.component.html',
  styleUrls: ['./swimming.component.scss'],
})
export class SwimmingAdminComponent implements OnInit {
  rows: ISwimmingBooking[] = [];
  offers: ISwimmingOffer[] = [];
  loading = false;
  error = '';

  page = 1;
  pageSize = 12;
  total = 0;
  search = '';
  bookingTypeFilter: SwimmingBookingType | '' = '';
  statusFilter: SwimmingBookingStatus | '' = '';
  paymentStatusFilter: SwimmingPaymentStatus | '' = '';
  paymentMethodFilter: SwimmingPaymentMethod | '' = '';

  totalBookings = 0;
  pendingPayments = 0;
  activeBookings = 0;
  totalPaidRevenue = 0;

  readonly statuses: SwimmingBookingStatus[] = ['new', 'confirmed', 'checked_in', 'completed', 'cancelled'];
  readonly paymentStatuses: SwimmingPaymentStatus[] = ['pending', 'paid', 'failed', 'refunded'];
  readonly bookingTypes: SwimmingBookingType[] = ['day_pass', 'family_pass', 'lessons', 'membership'];

  constructor(private swimmingService: SwimmingAdminService) {}

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';

    this.swimmingService
      .listBookings({
        page: this.page,
        pageSize: this.pageSize,
        search: this.search || undefined,
        bookingType: this.bookingTypeFilter || undefined,
        status: this.statusFilter || undefined,
        paymentStatus: this.paymentStatusFilter || undefined,
        paymentMethod: this.paymentMethodFilter || undefined,
      })
      .subscribe({
        next: (response) => {
          this.rows = response.rows.data;
          this.total = response.rows.total;
          this.page = response.rows.page;
          this.pageSize = response.rows.pageSize;
          this.offers = response.offers;
          this.totalBookings = response.totals.totalBookings;
          this.pendingPayments = response.totals.pendingPayments;
          this.activeBookings = response.totals.activeBookings;
          this.totalPaidRevenue = response.totals.totalPaidRevenue;
          this.loading = false;
        },
        error: (error) => {
          this.error = error?.error?.message || 'Failed to load swimming bookings.';
          this.loading = false;
        },
      });
  }

  applyFilters(): void {
    this.page = 1;
    this.load();
  }

  clearFilters(): void {
    this.search = '';
    this.bookingTypeFilter = '';
    this.statusFilter = '';
    this.paymentStatusFilter = '';
    this.paymentMethodFilter = '';
    this.page = 1;
    this.load();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.page) return;
    this.page = page;
    this.load();
  }

  updateStatus(row: ISwimmingBooking, status: SwimmingBookingStatus): void {
    this.swimmingService.updateStatus(row.id, { status }).subscribe({
      next: () => this.load(),
      error: (error) => {
        this.error = error?.error?.message || 'Failed to update swimming status.';
      },
    });
  }

  updatePaymentStatus(row: ISwimmingBooking, paymentStatus: SwimmingPaymentStatus): void {
    this.swimmingService.updatePaymentStatus(row.id, { paymentStatus }).subscribe({
      next: () => this.load(),
      error: (error) => {
        this.error = error?.error?.message || 'Failed to update swimming payment.';
      },
    });
  }

  prettyLabel(value: string): string {
    return value.replace(/_/g, ' ');
  }
}
