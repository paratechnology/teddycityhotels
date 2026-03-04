import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  IKitchenMenuItem,
  IKitchenOrder,
  KitchenOrderPaymentMethod,
  KitchenOrderPaymentStatus,
  KitchenOrderStatus,
} from '@teddy-city-hotels/shared-interfaces';
import { KitchenService } from '../../services/kitchen.service';
import { AttachmentService } from '../../services/attachment.service';

@Component({
  selector: 'app-kitchen',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './kitchen.component.html',
  styleUrls: ['./kitchen.component.scss'],
})
export class KitchenComponent implements OnInit {
  activeTab: 'orders' | 'menu' = 'orders';
  showMenuModal = false;

  menuRows: IKitchenMenuItem[] = [];
  menuLoading = false;
  menuPage = 1;
  menuPageSize = 10;
  menuTotal = 0;
  menuSearch = '';
  menuCategoryFilter: '' | 'food' | 'drink' = '';
  menuAvailabilityFilter: '' | 'true' | 'false' = '';

  orderRows: IKitchenOrder[] = [];
  orderLoading = false;
  ordersPage = 1;
  ordersPageSize = 12;
  ordersTotal = 0;
  ordersSearch = '';
  orderStatusFilter: KitchenOrderStatus | '' = '';
  paymentStatusFilter: KitchenOrderPaymentStatus | '' = '';
  paymentMethodFilter: KitchenOrderPaymentMethod | '' = '';

  totalOrders = 0;
  pendingPayments = 0;
  pendingKitchen = 0;

  savingMenu = false;
  uploadingMenuImage = false;
  editingMenuId = '';
  error = '';

  menuForm: FormGroup;

  readonly orderStatuses: KitchenOrderStatus[] = ['new', 'preparing', 'ready', 'completed', 'cancelled'];
  readonly paymentStatuses: KitchenOrderPaymentStatus[] = ['pending', 'paid', 'failed', 'refunded'];

  constructor(
    private kitchenService: KitchenService,
    private attachmentService: AttachmentService,
    private fb: FormBuilder
  ) {
    this.menuForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      category: ['food', Validators.required],
      price: [0, [Validators.required, Validators.min(1)]],
      imageUrl: [''],
      available: [true],
    });
  }

  get totalMenuPages(): number {
    return Math.max(1, Math.ceil(this.menuTotal / this.menuPageSize));
  }

  get totalOrdersPages(): number {
    return Math.max(1, Math.ceil(this.ordersTotal / this.ordersPageSize));
  }

  ngOnInit(): void {
    this.loadMenu();
    this.loadOrders();
  }

  loadMenu(): void {
    this.menuLoading = true;
    this.error = '';

    this.kitchenService
      .listAdminMenu({
        page: this.menuPage,
        pageSize: this.menuPageSize,
        search: this.menuSearch || undefined,
        category: this.menuCategoryFilter || undefined,
        available: this.menuAvailabilityFilter || undefined,
      })
      .subscribe({
        next: (response) => {
          this.menuRows = response.data;
          this.menuTotal = response.total;
          this.menuPage = response.page;
          this.menuPageSize = response.pageSize;
          this.menuLoading = false;
        },
        error: (error: { error?: { message?: string } }) => {
          this.error = error?.error?.message || 'Failed to load kitchen menu.';
          this.menuLoading = false;
        },
      });
  }

  loadOrders(): void {
    this.orderLoading = true;
    this.error = '';

    this.kitchenService
      .listOrders({
        page: this.ordersPage,
        pageSize: this.ordersPageSize,
        search: this.ordersSearch || undefined,
        orderStatus: this.orderStatusFilter || undefined,
        paymentStatus: this.paymentStatusFilter || undefined,
        paymentMethod: this.paymentMethodFilter || undefined,
      })
      .subscribe({
        next: (response) => {
          this.orderRows = response.rows.data;
          this.ordersTotal = response.rows.total;
          this.ordersPage = response.rows.page;
          this.ordersPageSize = response.rows.pageSize;
          this.totalOrders = response.totals.totalOrders;
          this.pendingPayments = response.totals.pendingPayments;
          this.pendingKitchen = response.totals.pendingKitchen;
          this.orderLoading = false;
        },
        error: (error: { error?: { message?: string } }) => {
          this.error = error?.error?.message || 'Failed to load kitchen orders.';
          this.orderLoading = false;
        },
      });
  }

  saveMenuItem(): void {
    if (this.menuForm.invalid) {
      this.menuForm.markAllAsTouched();
      return;
    }

    this.savingMenu = true;
    this.error = '';
    const value = this.menuForm.getRawValue();
    const payload = {
      name: value['name'],
      description: value['description'],
      category: value['category'],
      price: Number(value['price']),
      imageUrl: value['imageUrl'] || undefined,
      available: !!value['available'],
    };

    const request = this.editingMenuId
      ? this.kitchenService.updateMenuItem(this.editingMenuId, payload)
      : this.kitchenService.createMenuItem(payload);

    request.subscribe({
      next: () => {
        this.savingMenu = false;
        this.showMenuModal = false;
        this.resetMenuForm();
        this.menuPage = 1;
        this.loadMenu();
      },
      error: (error: { error?: { message?: string } }) => {
        this.savingMenu = false;
        this.error = error?.error?.message || 'Failed to save menu item.';
      },
    });
  }

  async onMenuImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadingMenuImage = true;
    this.error = '';

    try {
      const signed = await firstValueFrom(
        this.attachmentService.generateUploadUrl(file.name, file.type || 'application/octet-stream')
      );
      const uploadResponse = await fetch(signed.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Image upload failed for ${file.name}.`);
      }

      const published = await firstValueFrom(this.attachmentService.publishUpload(signed.filePath));
      this.menuForm.patchValue({ imageUrl: published.publicUrl });
    } catch (error) {
      this.error =
        error instanceof Error ? error.message : 'Menu image upload failed. Please try again.';
    } finally {
      this.uploadingMenuImage = false;
      input.value = '';
    }
  }

  clearMenuImage(): void {
    this.menuForm.patchValue({ imageUrl: '' });
  }

  editMenuItem(row: IKitchenMenuItem): void {
    this.editingMenuId = row.id;
    this.showMenuModal = true;
    this.menuForm.patchValue({
      name: row.name,
      description: row.description,
      category: row.category,
      price: row.price,
      imageUrl: row.imageUrl || '',
      available: row.available,
    });
  }

  toggleMenuAvailability(row: IKitchenMenuItem): void {
    this.kitchenService.updateMenuItem(row.id, { available: !row.available }).subscribe({
      next: () => this.loadMenu(),
      error: (error: { error?: { message?: string } }) => {
        this.error = error?.error?.message || 'Failed to update availability.';
      },
    });
  }

  deleteMenuItem(row: IKitchenMenuItem): void {
    if (!confirm(`Delete menu item "${row.name}"?`)) return;

    this.kitchenService.deleteMenuItem(row.id).subscribe({
      next: () => {
        this.menuPage = 1;
        this.loadMenu();
      },
      error: (error: { error?: { message?: string } }) => {
        this.error = error?.error?.message || 'Failed to delete menu item.';
      },
    });
  }

  updateOrderStatus(row: IKitchenOrder, orderStatus: KitchenOrderStatus): void {
    this.kitchenService.updateOrderStatus(row.id, { orderStatus }).subscribe({
      next: () => this.loadOrders(),
      error: (error: { error?: { message?: string } }) => {
        this.error = error?.error?.message || 'Failed to update order status.';
      },
    });
  }

  updatePaymentStatus(row: IKitchenOrder, paymentStatus: KitchenOrderPaymentStatus): void {
    this.kitchenService.updateOrderPaymentStatus(row.id, { paymentStatus }).subscribe({
      next: () => this.loadOrders(),
      error: (error: { error?: { message?: string } }) => {
        this.error = error?.error?.message || 'Failed to update payment status.';
      },
    });
  }

  resetMenuForm(): void {
    this.editingMenuId = '';
    this.menuForm.reset({
      name: '',
      description: '',
      category: 'food',
      price: 0,
      imageUrl: '',
      available: true,
    });
  }

  openMenuModal(): void {
    this.showMenuModal = true;
  }

  closeMenuModal(): void {
    this.showMenuModal = false;
    this.resetMenuForm();
  }

  applyMenuFilters(): void {
    this.menuPage = 1;
    this.loadMenu();
  }

  clearMenuFilters(): void {
    this.menuSearch = '';
    this.menuCategoryFilter = '';
    this.menuAvailabilityFilter = '';
    this.menuPage = 1;
    this.loadMenu();
  }

  applyOrderFilters(): void {
    this.ordersPage = 1;
    this.loadOrders();
  }

  clearOrderFilters(): void {
    this.ordersSearch = '';
    this.orderStatusFilter = '';
    this.paymentStatusFilter = '';
    this.paymentMethodFilter = '';
    this.ordersPage = 1;
    this.loadOrders();
  }

  goToMenuPage(page: number): void {
    if (page < 1 || page > this.totalMenuPages || page === this.menuPage) return;
    this.menuPage = page;
    this.loadMenu();
  }

  goToOrdersPage(page: number): void {
    if (page < 1 || page > this.totalOrdersPages || page === this.ordersPage) return;
    this.ordersPage = page;
    this.loadOrders();
  }

  orderItemsLabel(row: IKitchenOrder): string {
    return row.items.map((item) => `${item.quantity}x ${item.name}`).join(', ');
  }
}
