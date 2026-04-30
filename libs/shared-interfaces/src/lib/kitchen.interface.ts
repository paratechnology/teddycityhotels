import { PaginatedResponse } from './legacy-compat.interface';
import { IPaymentInitializationData } from './response';

export type KitchenMenuCategory = 'food' | 'drink';
export type KitchenOrderPaymentMethod = 'online' | 'cash';
export type KitchenOrderPaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type KitchenOrderStatus = 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface IKitchenMenuItem {
  id: string;
  /** Property this menu item belongs to. Optional during migration. */
  propertyId?: string;
  name: string;
  description: string;
  category: KitchenMenuCategory;
  price: number;
  imageUrl?: string;
  available: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateKitchenMenuItemDto {
  propertyId?: string;
  name: string;
  description: string;
  category: KitchenMenuCategory;
  price: number;
  imageUrl?: string;
  available?: boolean;
}

export interface IUpdateKitchenMenuItemDto {
  name?: string;
  description?: string;
  category?: KitchenMenuCategory;
  price?: number;
  imageUrl?: string;
  available?: boolean;
}

export interface IKitchenOrderLine {
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface IKitchenOrder {
  id: string;
  /** Property the order was placed at. Optional during migration. */
  propertyId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: IKitchenOrderLine[];
  totalAmount: number;
  paymentMethod: KitchenOrderPaymentMethod;
  paymentStatus: KitchenOrderPaymentStatus;
  orderStatus: KitchenOrderStatus;
  source: 'website' | 'admin';
  note?: string;
  paymentReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateKitchenOrderItemDto {
  menuItemId: string;
  quantity: number;
}

export interface ICreateKitchenOrderDto {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: ICreateKitchenOrderItemDto[];
  paymentMethod: KitchenOrderPaymentMethod;
  source?: 'website' | 'admin';
  note?: string;
  callbackUrl?: string;
}

export interface IUpdateKitchenOrderStatusDto {
  orderStatus: KitchenOrderStatus;
}

export interface IUpdateKitchenOrderPaymentStatusDto {
  paymentStatus: KitchenOrderPaymentStatus;
}

export interface IKitchenOrdersResponse {
  rows: PaginatedResponse<IKitchenOrder>;
  totals: {
    totalOrders: number;
    pendingPayments: number;
    pendingKitchen: number;
  };
}

export interface IKitchenOrderCreateResponse {
  order: IKitchenOrder;
  paymentData?: IPaymentInitializationData;
}
