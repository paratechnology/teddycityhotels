import { PaginatedResponse } from './legacy-compat.interface';

export type RevenueSourceType =
  | 'booking'
  | 'snooker_registration'
  | 'food_and_beverage'
  | 'swimming'
  | 'manual';

export type RevenuePaymentMethod = 'online' | 'cash' | 'bank_transfer' | 'card' | 'other';
export type RevenuePaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface IRevenueRecord {
  id: string;
  sourceType: RevenueSourceType;
  description: string;
  amount: number;
  paymentMethod: RevenuePaymentMethod;
  paymentStatus: RevenuePaymentStatus;
  relatedId?: string;
  createdAt: string;
  updatedAt: string;
  receivedAt?: string;
}

export interface ICreateRevenueRecordDto {
  sourceType: RevenueSourceType;
  description: string;
  amount: number;
  paymentMethod?: RevenuePaymentMethod;
  paymentStatus?: RevenuePaymentStatus;
  relatedId?: string;
  receivedAt?: string;
}

export interface IUpdateRevenuePaymentStatusDto {
  paymentStatus: RevenuePaymentStatus;
}

export interface IRevenueSummary {
  totalPaidRevenue: number;
  pendingRevenue: number;
  paidBySource: Record<RevenueSourceType, number>;
}

export interface IRevenueListResponse {
  rows: PaginatedResponse<IRevenueRecord>;
  summary: IRevenueSummary;
}
