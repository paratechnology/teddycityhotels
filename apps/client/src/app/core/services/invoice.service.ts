import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { IInvoice, baseURL } from '@quickprolaw/shared-interfaces';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private http = inject(HttpClient);

  getInvoicesByClient(clientId: string): Observable<IInvoice[]> {
    const endpoint = `${baseURL}invoices/client/${clientId}`;
    return this.http.get<IInvoice[]>(endpoint);
  }
}