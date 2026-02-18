import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap, map, finalize } from 'rxjs/operators';
import { baseURL, IClient, PaginatedResponse } from '@quickprolaw/shared-interfaces';

export interface ClientFilters {
  page: number;
  pageSize: number;
  search?: string;
  status?: string; // Updated
  type?: string;   // Updated
}

interface ClientsState {
  clients: IClient[];
  selectedClient: IClient | null;
  selectedClientStats: ClientFinancialStats | null;
  total: number;
  loading: boolean;
  loadingSelected: boolean;
  error: string | null;
}

export interface ClientFinancialStats {
  trustBalance: number;
  totalBilled: number;
  totalPaid: number;
  outstanding: number;
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private http = inject(HttpClient);
  private url = baseURL + 'clients';

  private state = signal<ClientsState>({
    clients: [],
    selectedClient: null,
    selectedClientStats: null,
    total: 0,
    loading: false,
    loadingSelected: false,
    error: null,
  });

  public clients = computed(() => this.state().clients);
  public selectedClient = computed(() => this.state().selectedClient);
  public selectedClientStats = computed(() => this.state().selectedClientStats); 
  public totalClients = computed(() => this.state().total);
  public loading = computed(() => this.state().loading);
  public loadingSelected = computed(() => this.state().loadingSelected);

  // Prevent concurrent page loads
  private loadingPage = false;

  loadClients(filters: ClientFilters): Observable<PaginatedResponse<IClient>> {
    if (this.loadingPage && filters.page !== 1) {
      return of({ data: [], total: this.totalClients(), page: filters.page, pageSize: filters.pageSize, totalPages: 0 });
    }

    this.loadingPage = true;
    this.state.update((s) => ({ ...s, loading: true }));

    let params = new HttpParams()
      .set('page', filters.page.toString())
      .set('pageSize', filters.pageSize.toString());

    if (filters.search) params = params.set('search', filters.search);
    if (filters.status && filters.status !== 'all') params = params.set('status', filters.status);
    if (filters.type && filters.type !== 'all') params = params.set('type', filters.type);

    return this.http.get<PaginatedResponse<IClient>>(this.url, { params }).pipe(
      tap((response) => {
        this.state.update((s) => ({
          ...s,
          // Append if paging, replace if searching/filtering (page 1)
          clients: filters.page === 1 ? response.data : [...s.clients, ...response.data],
          total: response.total,
          loading: false,
        }));
      }),
      catchError((err) => {
        console.error('ClientsService Error:', err);
        this.state.update((s) => ({ ...s, error: 'Failed to load clients.', loading: false }));
        return of({ data: [], total: 0, page: 1, pageSize: 15, totalPages: 0 });
      }),
      finalize(() => this.loadingPage = false)
    );
  }

  refreshClients(filters: ClientFilters) {
    // Reset list when filtering/searching
    this.loadingPage = false;
    this.state.update(s => ({ ...s, clients: [], total: 0 }));
    return this.loadClients(filters);
  }

  createClient(clientData: Partial<IClient>): Observable<IClient> {
    this.state.update(s => ({ ...s, loading: true }));
    return this.http.post<{ success: boolean, id: string, data: IClient }>(this.url, clientData)
      .pipe(map(response => ({ ...response.data, id: response.id })),
        tap((newClient) => {
          this.state.update(s => ({
            ...s,
            clients: [newClient, ...s.clients],
            total: s.total + 1,
            loading: false,
          }));
        }),
        catchError((err) => {
          this.state.update(s => ({ ...s, error: 'Failed to create client.', loading: false }));
          throw err;
        })
      );
  }

  updateClient(id: string, clientData: Partial<IClient>): Observable<IClient> {
    this.state.update(s => ({ ...s, loadingSelected: true }));
    return this.http.put<{ success: boolean, data: IClient }>(`${this.url}/profile/${id}`, clientData).pipe(
      map(response => response.data),
      tap((updatedClient) => {
        this.state.update(s => ({
          ...s,
          selectedClient: updatedClient,
          clients: s.clients.map(c => c.id === id ? updatedClient : c),
          loadingSelected: false,
        }));
      }),
      catchError((err) => {
        this.state.update(s => ({ ...s, error: 'Failed to update client.', loadingSelected: false }));
        throw err;
      })
    );
  }

  deleteClient(id: string): Observable<{ success: boolean, message: string }> {
    this.state.update(s => ({ ...s, loadingSelected: true }));
    return this.http.delete<{ success: boolean, message: string }>(`${this.url}/profile/${id}`).pipe(
      tap(() => {
        this.state.update(s => ({
          ...s,
          clients: s.clients.filter(c => c.id !== id),
          selectedClient: s.selectedClient?.id === id ? null : s.selectedClient,
          loadingSelected: false,
        }));
      }),
      catchError((err) => {
        this.state.update(s => ({ ...s, error: 'Failed to delete client.', loadingSelected: false }));
        throw err;
      })
    );
  }

  getClientById(id: string): Observable<IClient> {
    this.state.update(s => ({ ...s, loadingSelected: true, selectedClient: null }));
    return this.http.get<IClient>(`${this.url}/profile/${id}`).pipe(
      tap(client => {
        this.state.update(s => ({
          ...s,
          selectedClient: client,
          loadingSelected: false
        }));
      }),
      catchError((err) => {
        this.state.update(s => ({ ...s, error: 'Failed to load client details.', loadingSelected: false }));
        throw err;
      })
    );
  }

  getAllClientsForSelection(): Observable<IClient[]> {
    return this.http.get<PaginatedResponse<IClient>>(`${this.url}`).pipe(
      map(response => response.data),
      catchError((err) => {
        console.error('Failed to fetch all clients for selection', err);
        return of([]);
      })
    );
  }


  getClientFinancialStats(id: string): Observable<ClientFinancialStats> {
    return this.http.get<ClientFinancialStats>(`${this.url}/profile/${id}/financials`).pipe(
      tap(stats => {
        this.state.update(s => ({ ...s, selectedClientStats: stats }));
      }),
      catchError(err => {
        console.error('Failed to load stats', err);
        return of({ trustBalance: 0, totalBilled: 0, totalPaid: 0, outstanding: 0 });
      })
    );
  }


}