import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  baseURL,
  ICreateKitchenOrderDto,
  IKitchenMenuItem,
  IKitchenOrderCreateResponse,
} from '@teddy-city-hotels/shared-interfaces';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PublicKitchenService {
  private http = inject(HttpClient);
  private readonly kitchenUrl = `${baseURL}kitchen`;

  listMenu(): Observable<IKitchenMenuItem[]> {
    return this.http.get<IKitchenMenuItem[]>(`${this.kitchenUrl}/menu`);
  }

  createOrder(payload: ICreateKitchenOrderDto): Observable<IKitchenOrderCreateResponse> {
    return this.http.post<IKitchenOrderCreateResponse>(`${this.kitchenUrl}/orders`, payload);
  }
}
