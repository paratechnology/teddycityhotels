import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IRevenueRecord,
  RevenuePaymentMethod,
  RevenuePaymentStatus,
  RevenueSourceType,
} from '@teddy-city-hotels/shared-interfaces';
import { RevenueService } from '../../services/revenue.service';

@Component({
  selector: 'app-revenue',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './revenue.component.html',
  styleUrls: ['./revenue.component.scss'],
})
export class RevenueComponent implements OnInit {
  rows: IRevenueRecord[] = [];
  loading = false;
  saving = false;
  error = '';
  showCreateModal = false;

  page = 1;
  pageSize = 12;
  total = 0;

  search = '';
  sourceFilter: RevenueSourceType | '' = '';
  paymentStatusFilter: RevenuePaymentStatus | '' = '';
  paymentMethodFilter: RevenuePaymentMethod | '' = '';

  totalPaidRevenue = 0;
  pendingRevenue = 0;
  paidBySource: Record<RevenueSourceType, number> = {
    booking: 0,
    snooker_registration: 0,
    food_and_beverage: 0,
    swimming: 0,
    manual: 0,
  };

  manualForm: FormGroup;

  readonly sourceOptions: Array<{ value: RevenueSourceType | ''; label: string }> = [
    { value: '', label: 'All sources' },
    { value: 'booking', label: 'Booking' },
    { value: 'snooker_registration', label: 'Snooker Registration' },
    { value: 'food_and_beverage', label: 'Food & Beverage' },
    { value: 'swimming', label: 'Swimming' },
    { value: 'manual', label: 'Manual' },
  ];

  readonly paymentStatusOptions: Array<{ value: RevenuePaymentStatus | ''; label: string }> = [
    { value: '', label: 'All statuses' },
    { value: 'paid', label: 'Paid' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' },
  ];

  readonly paymentMethodOptions: Array<{ value: RevenuePaymentMethod | ''; label: string }> = [
    { value: '', label: 'All methods' },
    { value: 'online', label: 'Online' },
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'card', label: 'Card' },
    { value: 'other', label: 'Other' },
  ];

  constructor(private revenueService: RevenueService, private fb: FormBuilder) {
    this.manualForm = this.fb.group({
      sourceType: ['manual' as RevenueSourceType, Validators.required],
      description: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(1)]],
      paymentMethod: ['cash' as RevenuePaymentMethod, Validators.required],
      paymentStatus: ['paid' as RevenuePaymentStatus, Validators.required],
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  ngOnInit(): void {
    this.loadRevenue();
  }

  loadRevenue(): void {
    this.loading = true;
    this.error = '';

    this.revenueService
      .listRevenue({
        page: this.page,
        pageSize: this.pageSize,
        sourceType: this.sourceFilter || undefined,
        paymentStatus: this.paymentStatusFilter || undefined,
        paymentMethod: this.paymentMethodFilter || undefined,
        search: this.search || undefined,
      })
      .subscribe({
        next: (response) => {
          this.rows = response.rows.data;
          this.page = response.rows.page;
          this.pageSize = response.rows.pageSize;
          this.total = response.rows.total;
          this.totalPaidRevenue = response.summary.totalPaidRevenue;
          this.pendingRevenue = response.summary.pendingRevenue;
          this.paidBySource = response.summary.paidBySource;
          this.loading = false;
        },
        error: (error: { error?: { message?: string } }) => {
          this.error = error?.error?.message || 'Failed to load revenue records.';
          this.loading = false;
        },
      });
  }

  createManualRecord(): void {
    if (this.manualForm.invalid) {
      this.manualForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = '';

    const value = this.manualForm.getRawValue();
    this.revenueService
      .createRevenue({
        sourceType: value['sourceType'],
        description: value['description'],
        amount: Number(value['amount']),
        paymentMethod: value['paymentMethod'],
        paymentStatus: value['paymentStatus'],
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.showCreateModal = false;
          this.manualForm.reset({
            sourceType: 'manual',
            description: '',
            amount: 0,
            paymentMethod: 'cash',
            paymentStatus: 'paid',
          });
          this.page = 1;
          this.loadRevenue();
        },
        error: (error: { error?: { message?: string } }) => {
          this.saving = false;
          this.error = error?.error?.message || 'Failed to create revenue record.';
        },
      });
  }

  setPaymentStatus(row: IRevenueRecord, paymentStatus: RevenuePaymentStatus): void {
    this.revenueService.updatePaymentStatus(row.id, { paymentStatus }).subscribe({
      next: () => this.loadRevenue(),
      error: (error: { error?: { message?: string } }) => {
        this.error = error?.error?.message || 'Failed to update payment status.';
      },
    });
  }

  applyFilters(): void {
    this.page = 1;
    this.loadRevenue();
  }

  clearFilters(): void {
    this.search = '';
    this.sourceFilter = '';
    this.paymentStatusFilter = '';
    this.paymentMethodFilter = '';
    this.page = 1;
    this.loadRevenue();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.page) return;
    this.page = page;
    this.loadRevenue();
  }

  openCreateModal(): void {
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }
}
