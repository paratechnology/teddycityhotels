import { Injectable, signal, computed, inject, WritableSignal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { baseURL, FetchStatus, IMatter, MatterStatus, PaginatedResponse, MatterFilters } from '@quickprolaw/shared-interfaces';

interface MattersState {
  matters: IMatter[];
  selectedMatter: IMatter | null;
  total: number;
  loading: boolean;
  loadingSelected: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class MatterService {
  private http = inject(HttpClient);
  private url = baseURL + 'matters';

  public fetchStatus = signal<FetchStatus>('idle');
  public status: WritableSignal<MatterStatus> = signal('open');

  private state = signal<MattersState>({
    matters: [],
    selectedMatter: null,
    total: 0,
    loading: false,
    loadingSelected: false,
    error: null,
  });

  public matters = computed(() => this.state().matters);
  public selectedMatter = computed(() => this.state().selectedMatter);
  public totalMatters = computed(() => this.state().total);
  public loading = computed(() => this.state().loading);
  public loadingSelected = computed(() => this.state().loadingSelected);

  // Prevent concurrent page loads
  private loadingPage = false;

  /**
   * Load matters with pagination (infinite scroll)
   * If page === 1 → replace
   * If page > 1 → append
   */
loadMatters(filters: MatterFilters): Observable<PaginatedResponse<IMatter>> {
  if (this.loadingPage && filters.page !== 1) {
    return of({
      data: [],
      total: this.totalMatters(),
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(this.totalMatters() / filters.pageSize),
    });
  }

  this.loadingPage = true;
  this.state.update((s) => ({ ...s, loading: true }));
  this.fetchStatus.set('loading');

  let params = new HttpParams()
    .set('page', filters.page.toString())
    .set('pageSize', filters.pageSize.toString());

  // Sort applies ONLY to Firestore listing, not Algolia search
  if (!filters.search) {
    params = params
      .set('sort', filters.sort || 'title')
      .set('order', filters.order || 'asc');
  }

  // Search applies only when searching
  if (filters.search) {
    params = params.set('search', filters.search);
  }

  // Status & type only for Firestore browsing
  if (!filters.search) {
    if (filters.type && filters.type !== 'all') params = params.set('type', filters.type);
    if (filters.status && filters.status !== 'all') params = params.set('status', filters.status);
  }

  if (filters.clientId) {
    params = params.set('clientId', filters.clientId);
  }

  return this.http.get<PaginatedResponse<IMatter>>(this.url, { params }).pipe(
    tap((response) => {
      const isFirstPage = filters.page === 1;

      this.state.update((s) => ({
        ...s,
        matters: isFirstPage ? response.data : [...s.matters, ...response.data],
        total: response.total,
        loading: false,
      }));

      this.fetchStatus.set('success');
    }),
    catchError((err) => {
      console.error('MattersService Error:', err);
      this.state.update((s) => ({
        ...s,
        error: 'Failed to load matters.',
        loading: false,
      }));
      this.fetchStatus.set('error');

      return of({
        data: [],
        total: 0,
        page: 1,
        pageSize: filters.pageSize,
        totalPages: 0,
      });
    }),
    tap(() => {
      this.loadingPage = false;
    })
  );
}


  /**
   * Refresh always resets to page 1 with a clean array
   */
  refreshMatters(filters: MatterFilters) {
    this.loadingPage = false;
    this.state.update((s) => ({
      ...s,
      matters: [],
      total: 0,
    }));
    return this.loadMatters({ ...filters, page: 1 });
  }

  // ------------------------
  // Create / Update / Delete
  // ------------------------

  createMatter(matterData: Partial<IMatter>): Observable<IMatter> {
    this.state.update(s => ({ ...s, loading: true }));

    return this.http.post<{ success: boolean, id: string, data: IMatter }>(this.url, matterData).pipe(
      map(response => ({ ...response.data, id: response.id })),
      tap((newMatter) => {
        this.state.update(s => ({
          ...s,
          matters: [newMatter, ...s.matters],
          total: s.total + 1,
          loading: false,
        }));
      }),
      catchError((err) => {
        this.state.update(s => ({ ...s, error: 'Failed to create matter.', loading: false }));
        throw err;
      })
    );
  }

  updateMatter(id: string, matterData: Partial<IMatter>): Observable<IMatter> {
    this.state.update(s => ({ ...s, loadingSelected: true }));

    return this.http.put<{ success: boolean, data: IMatter }>(`${this.url}/${id}`, matterData).pipe(
      map(response => response.data),
      tap((updatedMatter) => {
        this.state.update(s => ({
          ...s,
          selectedMatter: s.selectedMatter ? { ...s.selectedMatter, ...updatedMatter } : updatedMatter,
          matters: s.matters.map(m => m.id === id ? { ...m, ...updatedMatter } : m),
          loadingSelected: false,
        }));
      }),
      catchError((err) => {
        this.state.update(s => ({ ...s, error: 'Failed to update matter.', loadingSelected: false }));
        throw err;
      })
    );
  }

  deleteMatter(id: string): Observable<{ success: boolean, message: string }> {
    this.state.update(s => ({ ...s, loadingSelected: true }));

    return this.http.delete<{ success: boolean, message: string }>(`${this.url}/${id}`).pipe(
      tap(() => {
        this.state.update(s => ({
          ...s,
          matters: s.matters.filter(m => m.id !== id),
          selectedMatter: s.selectedMatter?.id === id ? null : s.selectedMatter,
          loadingSelected: false,
        }));
      }),
      catchError((err) => {
        this.state.update(s => ({ ...s, error: 'Failed to delete matter.', loadingSelected: false }));
        throw err;
      })
    );
  }

  getMatterById(id: string): Observable<IMatter> {
    this.state.update(s => ({ ...s, loadingSelected: true, selectedMatter: null }));
    return this.http.get<{ success: boolean, matterData: IMatter }>(`${this.url}/${id}`).pipe(
      map(response => response.matterData),
      tap(matter => {
        this.state.update(s => ({
          ...s,
          selectedMatter: matter,
          loadingSelected: false
        }));
      }),
      catchError((err) => {
        console.error('MattersService Error:', err);
        this.state.update(s => ({ ...s, error: 'Failed to load matter details.', loadingSelected: false }));
        throw err;
      })
    );
  }

  getMatterDashboard(id: string): Observable<any> {
    return this.http.get<any>(`${this.url}/${id}/dashboard`).pipe(
      catchError((err) => {
        console.error('Failed to load matter dashboard data', err);
        return throwError(() => err);
      })
    );
  }

  assignUserToMatter(id: string): Observable<any> {
    return this.http.get<any>(`${this.url}/${id}/dashboard`).pipe(
      catchError((err) => {
        console.error('Failed to load matter dashboard data', err);
        return throwError(() => err);
      })
    );
  }


  hasMoreMatters() {
    return false;
  }

  getMatters(): Observable<PaginatedResponse<IMatter[]>> {
    this.state.update(s => ({ ...s, loadingSelected: true, selectedMatter: null }));
    return this.http.get<PaginatedResponse<IMatter[]>>(`${this.url}`);
  }

  getMattersForSelection(): Observable<IMatter[]> {
    const params = new HttpParams().set('pageSize', '1000');
    return this.http.get<PaginatedResponse<IMatter>>(this.url, { params }).pipe(
      map(response => response.data),
      catchError(() => of([]))
    );
  }


checkUniqueness(field: 'suitNo' | 'fileNo', value: string): Observable<{ unique: boolean, existingTitle?: string }> {
    return this.http.get<{ unique: boolean, existingTitle?: string }>(`${this.url}/check-uniqueness`, {
      params: { field, value }
    }).pipe(
      catchError(() => of({ unique: true })) // On error, assume unique (allow user to proceed)
    );
  }
}
