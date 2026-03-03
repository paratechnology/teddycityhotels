import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ICreateKitchenMenuItemDto,
  IKitchenMenuItem,
  IKitchenOrder,
  IKitchenOrdersResponse,
  IUpdateKitchenMenuItemDto,
  IUpdateKitchenOrderPaymentStatusDto,
  IUpdateKitchenOrderStatusDto,
  PaginatedResponse,
  baseURL,
} from '@teddy-city-hotels/shared-interfaces';

@Injectable({ providedIn: 'root' })
export class KitchenService {
  private kitchenUrl = `${baseURL}kitchen`;

  constructor(private http: HttpClient) {}

  listAdminMenu(params: {
    page: number;
    pageSize: number;
    search?: string;
    category?: string;
    available?: string;
  }): Observable<PaginatedResponse<IKitchenMenuItem>> {
    const query = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize),
    });

    if (params.search?.trim()) query.set('search', params.search.trim());
    if (params.category) query.set('category', params.category);
    if (params.available) query.set('available', params.available);

    return this.http.get<PaginatedResponse<IKitchenMenuItem>>(
      `${this.kitchenUrl}/menu/admin?${query.toString()}`
    );
  }

  createMenuItem(payload: ICreateKitchenMenuItemDto): Observable<IKitchenMenuItem> {
    return this.http.post<IKitchenMenuItem>(`${this.kitchenUrl}/menu`, payload);
  }

  updateMenuItem(menuId: string, payload: IUpdateKitchenMenuItemDto): Observable<IKitchenMenuItem> {
    return this.http.patch<IKitchenMenuItem>(`${this.kitchenUrl}/menu/${menuId}`, payload);
  }

  deleteMenuItem(menuId: string): Observable<void> {
    return this.http.delete<void>(`${this.kitchenUrl}/menu/${menuId}`);
  }

  listOrders(params: {
    page: number;
    pageSize: number;
    search?: string;
    orderStatus?: string;
    paymentStatus?: string;
    paymentMethod?: string;
  }): Observable<IKitchenOrdersResponse> {
    const query = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize),
    });

    if (params.search?.trim()) query.set('search', params.search.trim());
    if (params.orderStatus) query.set('orderStatus', params.orderStatus);
    if (params.paymentStatus) query.set('paymentStatus', params.paymentStatus);
    if (params.paymentMethod) query.set('paymentMethod', params.paymentMethod);

    return this.http.get<IKitchenOrdersResponse>(`${this.kitchenUrl}/orders?${query.toString()}`);
  }

  updateOrderStatus(orderId: string, payload: IUpdateKitchenOrderStatusDto): Observable<IKitchenOrder> {
    return this.http.patch<IKitchenOrder>(`${this.kitchenUrl}/orders/${orderId}/status`, payload);
  }

  updateOrderPaymentStatus(
    orderId: string,
    payload: IUpdateKitchenOrderPaymentStatusDto
  ): Observable<IKitchenOrder> {
    return this.http.patch<IKitchenOrder>(`${this.kitchenUrl}/orders/${orderId}/payment-status`, payload);
  }
}
