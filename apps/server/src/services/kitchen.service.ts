import { inject, injectable } from 'tsyringe';
import {
  ICreateKitchenMenuItemDto,
  IKitchenOrderCreateResponse,
  ICreateKitchenOrderDto,
  IKitchenMenuItem,
  IKitchenOrder,
  IKitchenOrderLine,
  IKitchenOrdersResponse,
  IUpdateKitchenMenuItemDto,
  KitchenOrderPaymentMethod,
  KitchenOrderPaymentStatus,
  KitchenOrderStatus,
  PaginatedResponse,
} from '@teddy-city-hotels/shared-interfaces';
import { FirestoreService } from './firestore.service';
import { BadRequestError, NotFoundError } from '../errors/http-errors';
import { FinancialsService } from './financials.service';
import { NotificationService } from './notification.service';
import { NotificationType } from '@teddy-city-hotels/shared-interfaces';
import { PaystackService } from './paystack.service';

@injectable()
export class KitchenService {
  constructor(
    @inject(FirestoreService) private firestore: FirestoreService,
    @inject(PaystackService) private paystackService: PaystackService,
    @inject(FinancialsService) private financialsService: FinancialsService,
    @inject(NotificationService) private notificationService: NotificationService
  ) {}

  private getMenuCollection() {
    return this.firestore.db.collection('kitchenMenuItems');
  }

  private getOrdersCollection() {
    return this.firestore.db.collection('kitchenOrders');
  }

  private normalizePaging(params: { page?: number; pageSize?: number }) {
    return {
      page: Number.isFinite(params.page) ? Math.max(1, Number(params.page)) : 1,
      pageSize: Number.isFinite(params.pageSize)
        ? Math.min(100, Math.max(1, Number(params.pageSize)))
        : 12,
    };
  }

  private parseAmount(input: unknown): number {
    const amount = Number(input);
    if (!Number.isFinite(amount) || amount < 0) {
      throw new BadRequestError('Amount must be a non-negative number.');
    }
    return Math.round(amount * 100) / 100;
  }

  async listPublicMenu(): Promise<IKitchenMenuItem[]> {
    const snapshot = await this.getMenuCollection()
      .where('available', '==', true)
      .orderBy('name', 'asc')
      .get();

    if (snapshot.empty) return [];
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as IKitchenMenuItem));
  }

  async listAdminMenu(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    category?: string;
    available?: string;
  }): Promise<PaginatedResponse<IKitchenMenuItem>> {
    const paging = this.normalizePaging(params);
    const snapshot = await this.getMenuCollection().orderBy('createdAt', 'desc').get();

    const rows = snapshot.empty
      ? []
      : snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as IKitchenMenuItem));

    let filtered = rows;
    if (params.category) {
      filtered = filtered.filter((row) => row.category === params.category);
    }

    if (params.available === 'true' || params.available === 'false') {
      const target = params.available === 'true';
      filtered = filtered.filter((row) => row.available === target);
    }

    if (params.search?.trim()) {
      const search = params.search.trim().toLowerCase();
      filtered = filtered.filter((row) => {
        return (
          row.name.toLowerCase().includes(search) ||
          row.description.toLowerCase().includes(search) ||
          row.category.toLowerCase().includes(search)
        );
      });
    }

    const total = filtered.length;
    const start = (paging.page - 1) * paging.pageSize;

    return {
      data: filtered.slice(start, start + paging.pageSize),
      total,
      page: paging.page,
      pageSize: paging.pageSize,
    };
  }

  async createMenuItem(payload: ICreateKitchenMenuItemDto): Promise<IKitchenMenuItem> {
    if (!payload.name?.trim()) {
      throw new BadRequestError('Menu name is required.');
    }

    const now = new Date().toISOString();
    const ref = this.getMenuCollection().doc();
    const next: IKitchenMenuItem = {
      id: ref.id,
      name: payload.name.trim(),
      description: payload.description?.trim() || '',
      category: payload.category,
      price: this.parseAmount(payload.price),
      imageUrl: payload.imageUrl?.trim() || undefined,
      available: payload.available ?? true,
      createdAt: now,
      updatedAt: now,
    };

    await ref.set(next);
    return next;
  }

  async updateMenuItem(menuId: string, payload: IUpdateKitchenMenuItemDto): Promise<IKitchenMenuItem> {
    const ref = this.getMenuCollection().doc(menuId);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new NotFoundError('Menu item not found.');
    }

    const updates: Partial<IKitchenMenuItem> = {
      updatedAt: new Date().toISOString(),
    };

    if (payload.name !== undefined) updates.name = payload.name.trim();
    if (payload.description !== undefined) updates.description = payload.description.trim();
    if (payload.category !== undefined) updates.category = payload.category;
    if (payload.price !== undefined) updates.price = this.parseAmount(payload.price);
    if (payload.imageUrl !== undefined) updates.imageUrl = payload.imageUrl.trim() || undefined;
    if (payload.available !== undefined) updates.available = payload.available;

    await ref.set(updates, { merge: true });
    const next = await ref.get();
    return { id: next.id, ...next.data() } as IKitchenMenuItem;
  }

  async deleteMenuItem(menuId: string): Promise<void> {
    const ref = this.getMenuCollection().doc(menuId);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new NotFoundError('Menu item not found.');
    }

    await ref.delete();
  }

  async createOrder(payload: ICreateKitchenOrderDto): Promise<IKitchenOrderCreateResponse> {
    if (!payload.customerName?.trim()) {
      throw new BadRequestError('Customer name is required.');
    }
    if (!payload.items?.length) {
      throw new BadRequestError('Order must include at least one menu item.');
    }

    const lines: IKitchenOrderLine[] = [];
    for (const item of payload.items) {
      const quantity = Number(item.quantity || 0);
      if (!Number.isFinite(quantity) || quantity < 1) {
        throw new BadRequestError('Each order item quantity must be at least 1.');
      }

      const doc = await this.getMenuCollection().doc(item.menuItemId).get();
      if (!doc.exists) {
        throw new NotFoundError(`Menu item ${item.menuItemId} was not found.`);
      }

      const menu = { id: doc.id, ...doc.data() } as IKitchenMenuItem;
      if (!menu.available) {
        throw new BadRequestError(`Menu item ${menu.name} is currently unavailable.`);
      }

      const unitPrice = this.parseAmount(menu.price);
      const line: IKitchenOrderLine = {
        menuItemId: menu.id,
        name: menu.name,
        unitPrice,
        quantity,
        lineTotal: this.parseAmount(unitPrice * quantity),
      };
      lines.push(line);
    }

    const totalAmount = this.parseAmount(lines.reduce((sum, item) => sum + item.lineTotal, 0));
    const paymentMethod: KitchenOrderPaymentMethod = payload.paymentMethod;
    if (paymentMethod === 'online' && !payload.customerEmail?.trim()) {
      throw new BadRequestError('Customer email is required for online payment.');
    }

    const paymentStatus: KitchenOrderPaymentStatus = 'pending';

    const now = new Date().toISOString();
    const ref = this.getOrdersCollection().doc();
    const order: IKitchenOrder = {
      id: ref.id,
      customerName: payload.customerName.trim(),
      customerEmail: payload.customerEmail?.trim() || undefined,
      customerPhone: payload.customerPhone?.trim() || undefined,
      items: lines,
      totalAmount,
      paymentMethod,
      paymentStatus,
      orderStatus: 'new',
      source: payload.source || 'website',
      note: payload.note?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    await ref.set(order);

    await this.notificationService.createAdminNotification({
      title: 'New Kitchen Order',
      body: `${order.customerName} placed order ${order.id}.`,
      type: NotificationType.KITCHEN_ORDER_CREATED,
      link: '/kitchen',
      relatedId: order.id,
    });

    if (paymentMethod === 'online') {
      const paymentData = await this.paystackService.initializeTransaction({
        email: String(payload.customerEmail || '').trim(),
        amount: totalAmount,
        callbackUrl: payload.callbackUrl,
        metadata: {
          type: 'kitchen_order',
          orderId: order.id,
        },
      });

      await ref.set(
        {
          paymentReference: paymentData.reference,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return {
        order: {
          ...order,
          paymentReference: paymentData.reference,
        },
        paymentData,
      };
    }

    return { order };
  }

  async listOrders(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    orderStatus?: KitchenOrderStatus;
    paymentStatus?: KitchenOrderPaymentStatus;
    paymentMethod?: KitchenOrderPaymentMethod;
  }): Promise<IKitchenOrdersResponse> {
    const paging = this.normalizePaging(params);
    const snapshot = await this.getOrdersCollection().orderBy('createdAt', 'desc').get();

    const rows = snapshot.empty
      ? []
      : snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as IKitchenOrder));

    let filtered = rows;
    if (params.orderStatus) {
      filtered = filtered.filter((row) => row.orderStatus === params.orderStatus);
    }
    if (params.paymentStatus) {
      filtered = filtered.filter((row) => row.paymentStatus === params.paymentStatus);
    }
    if (params.paymentMethod) {
      filtered = filtered.filter((row) => row.paymentMethod === params.paymentMethod);
    }
    if (params.search?.trim()) {
      const search = params.search.trim().toLowerCase();
      filtered = filtered.filter((row) => {
        return (
          row.id.toLowerCase().includes(search) ||
          row.customerName.toLowerCase().includes(search) ||
          (row.customerEmail || '').toLowerCase().includes(search) ||
          row.items.some((item) => item.name.toLowerCase().includes(search))
        );
      });
    }

    const total = filtered.length;
    const start = (paging.page - 1) * paging.pageSize;

    return {
      rows: {
        data: filtered.slice(start, start + paging.pageSize),
        total,
        page: paging.page,
        pageSize: paging.pageSize,
      },
      totals: {
        totalOrders: rows.length,
        pendingPayments: rows.filter((row) => row.paymentStatus === 'pending').length,
        pendingKitchen: rows.filter((row) => ['new', 'preparing', 'ready'].includes(row.orderStatus))
          .length,
      },
    };
  }

  async updateOrderStatus(orderId: string, orderStatus: KitchenOrderStatus): Promise<IKitchenOrder> {
    const ref = this.getOrdersCollection().doc(orderId);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new NotFoundError('Order not found.');
    }

    await ref.set(
      {
        orderStatus,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    const next = await ref.get();
    const order = { id: next.id, ...next.data() } as IKitchenOrder;

    await this.notificationService.createAdminNotification({
      title: 'Kitchen Order Updated',
      body: `Order ${order.id} moved to ${orderStatus}.`,
      type: NotificationType.KITCHEN_ORDER_STATUS_CHANGED,
      link: '/kitchen',
      relatedId: order.id,
    });

    return order;
  }

  async updateOrderPaymentStatus(
    orderId: string,
    paymentStatus: KitchenOrderPaymentStatus
  ): Promise<IKitchenOrder> {
    const ref = this.getOrdersCollection().doc(orderId);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new NotFoundError('Order not found.');
    }

    await ref.set(
      {
        paymentStatus,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    const next = await ref.get();
    const order = { id: next.id, ...next.data() } as IKitchenOrder;
    await this.financialsService.upsertKitchenOrderRevenue(order);

    await this.notificationService.createAdminNotification({
      title: 'Kitchen Payment Updated',
      body: `Order ${order.id} payment is now ${paymentStatus}.`,
      type: NotificationType.KITCHEN_PAYMENT_STATUS_CHANGED,
      link: '/kitchen',
      relatedId: order.id,
    });

    return order;
  }

  async getOrderById(orderId: string): Promise<IKitchenOrder> {
    const doc = await this.getOrdersCollection().doc(orderId).get();
    if (!doc.exists) {
      throw new NotFoundError('Order not found.');
    }

    return { id: doc.id, ...doc.data() } as IKitchenOrder;
  }
}
