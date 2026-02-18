import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { baseURL, IProperty, IUnit, ILease, CreatePropertyDto, IMaintenanceRequest } from '@quickprolaw/shared-interfaces';

interface PropertyState {
  properties: IProperty[];
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PropertiesService {
  private http = inject(HttpClient);
  private url = baseURL + 'properties';

  private state = signal<PropertyState>({
    properties: [],
    loading: false,
    error: null,
  });

  public properties = computed(() => this.state().properties);
  public loading = computed(() => this.state().loading);

  // Computed Stats for Dashboard
  public portfolioStats = computed(() => {
    const props = this.state().properties;
    const total = props.length;
    // @ts-ignore - status type matching
    const vacant = props.filter(p => p.status === 'Vacant').length;
    // Assume we aggregate arrears from property stats
    // @ts-ignore - stats optional check
    const totalArrears = props.reduce((sum, p) => sum + (p.stats?.totalArrears || 0), 0);

    return { total, vacant, totalArrears };
  });

  loadProperties(): Observable<IProperty[]> {
    this.state.update(s => ({ ...s, loading: true }));
    return this.http.get<IProperty[]>(this.url).pipe(
      tap(data => this.state.update(s => ({ ...s, properties: data, loading: false }))),
      catchError(err => {
        this.state.update(s => ({ ...s, loading: false, error: 'Failed to load properties' }));
        return of([]);
      })
    );
  }

  createProperty(dto: CreatePropertyDto): Observable<IProperty> {
    return this.http.post<IProperty>(this.url, dto).pipe(
      tap(newProp => {
        this.state.update(s => ({
          ...s,
          properties: [newProp, ...s.properties]
        }));
      })
    );
  }

  /**
   * Used by Property Detail Page
   * Checks local state first, falls back to API
   */
  getPropertyById(id: string): Observable<IProperty> {
    const cached = this.state().properties.find(p => p.id === id);
    if (cached) return of(cached);

    return this.http.get<IProperty>(`${this.url}/${id}`);
  }

  // --- Sub-Collection Methods ---

  getUnits(propertyId: string): Observable<IUnit[]> {
    return this.http.get<IUnit[]>(`${this.url}/${propertyId}/units`);
  }

  createUnit(dto: { propertyId: string, name: string, targetRent: number, type: string }): Observable<IUnit> {
    return this.http.post<IUnit>(`${this.url}/${dto.propertyId}/units`, dto);
  }

  getLeases(propertyId: string): Observable<ILease[]> {
    return this.http.get<ILease[]>(`${this.url}/${propertyId}/leases`);
  }

  createTenancy(payload: { propertyId: string, unitId: string|null, tenant: any, lease: any }): Observable<void> {
    return this.http.post<void>(`${this.url}/${payload.propertyId}/tenancies`, payload);
  }

  getMaintenanceRequests(propertyId: string): Observable<IMaintenanceRequest[]> {
    return this.http.get<IMaintenanceRequest[]>(`${this.url}/${propertyId}/maintenance`);
  }


  /**
   * Fetches a unified ledger for the property:
   * 1. Invoices (Rent Demands)
   * 2. Expenses (Maintenance/Fees)
   * 3. Payments (Rent Received)
   */
  getPropertyLedger(propertyId: string): Observable<{
    invoices: any[],
    expenses: any[],
    stats: { collected: number, outstanding: number, expenses: number, netIncome: number }
  }> {
    // This endpoint should aggregate data on the backend for performance
    return this.http.get<any>(`${this.url}/${propertyId}/financials`);
  }

  /**
   * Record a rent payment from a tenant
   */
  recordRentPayment(payload: {
    leaseId: string,
    amount: number,
    date: string,
    method: string,
    reference?: string
  }): Observable<void> {
    return this.http.post<void>(`${this.url}/payments/rent`, payload);
  }


  /**
   * 1. Updates Maintenance Status to 'Completed'
   * 2. Creates a corresponding Expense record in the Property Ledger
   */
  convertMaintenanceToExpense(requestId: string, payload: { amount: number, date: string, description: string }): Observable<void> {
    return this.http.post<void>(`${this.url}/maintenance/${requestId}/convert-to-expense`, payload);
  }

  createMaintenanceRequest(dto: Partial<IMaintenanceRequest>): Observable<IMaintenanceRequest> {
    return this.http.post<IMaintenanceRequest>(`${this.url}/${dto.propertyId}/maintenance`, dto);
  }

  updateMaintenanceRequest(requestId: string, payload: Partial<IMaintenanceRequest>): Observable<void> {
    return this.http.patch<void>(`${this.url}/maintenance/${requestId}`, payload);
  }

  /**
   * Triggers the backend to generate a PDF for the lease.
   * Returns a URL to the generated file.
   */
  generateLeasePdf(leaseId: string): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.url}/leases/${leaseId}/generate-pdf`, {});
  }


  /**
   * Generates (or retrieves) a receipt PDF for a specific payment.
   * Returns the URL to the PDF.
   */
  getPaymentReceiptUrl(paymentId: string): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${this.url}/payments/${paymentId}/receipt`);
  }

  updateUnit(unitId: string, dto: Partial<IUnit>): Observable<void> {
    return this.http.patch<void>(`${baseURL}units/${unitId}`, dto);
  }

  deleteUnit(unitId: string): Observable<void> {
    return this.http.delete<void>(`${baseURL}units/${unitId}`);
  }
}