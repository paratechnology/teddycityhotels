import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ICreateRevenueRecordDto,
  IRevenueListResponse,
  IRevenueRecord,
  IUpdateRevenuePaymentStatusDto,
  baseURL,
} from '@teddy-city-hotels/shared-interfaces';

@Injectable({ providedIn: 'root' })
export class RevenueService {
  private financialUrl = `${baseURL}financials`;

  constructor(private http: HttpClient) {}

  listRevenue(params: {
    page: number;
    pageSize: number;
    sourceType?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    search?: string;
  }): Observable<IRevenueListResponse> {
    const query = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize),
    });

    if (params.sourceType) query.set('sourceType', params.sourceType);
    if (params.paymentStatus) query.set('paymentStatus', params.paymentStatus);
    if (params.paymentMethod) query.set('paymentMethod', params.paymentMethod);
    if (params.search?.trim()) query.set('search', params.search.trim());

    return this.http.get<IRevenueListResponse>(`${this.financialUrl}/revenue?${query.toString()}`);
  }

  createRevenue(payload: ICreateRevenueRecordDto): Observable<IRevenueRecord> {
    return this.http.post<IRevenueRecord>(`${this.financialUrl}/revenue`, payload);
  }

  updatePaymentStatus(revenueId: string, payload: IUpdateRevenuePaymentStatusDto): Observable<IRevenueRecord> {
    return this.http.patch<IRevenueRecord>(
      `${this.financialUrl}/revenue/${revenueId}/payment-status`,
      payload
    );
  }
}
