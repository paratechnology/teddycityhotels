import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { baseURL } from '@quickprolaw/shared-interfaces';
import { ITenant } from '@quickprolaw/shared-interfaces';

@Injectable({ providedIn: 'root' })
export class TenantsService {
  private http = inject(HttpClient);
  private url = baseURL + 'tenants';

  // State
  private tenantsSignal = signal<ITenant[]>([]);
  public tenants = this.tenantsSignal.asReadonly();

  loadTenants(): Observable<ITenant[]> {
    return this.http.get<ITenant[]>(this.url).pipe(
      tap(data => this.tenantsSignal.set(data))
    );
  }

  searchTenants(query: string): Observable<ITenant[]> {
    return this.http.get<ITenant[]>(`${this.url}/search?q=${query}`);
  }

  createTenant(tenant: Partial<ITenant>): Observable<ITenant> {
    return this.http.post<ITenant>(this.url, tenant).pipe(
      tap(newTenant => {
        this.tenantsSignal.update(list => [newTenant, ...list]);
      })
    );
  }
}