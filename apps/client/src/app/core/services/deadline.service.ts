import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { 
  baseURL, 
  IDeadline, 
  CreateDeadlineDto, 
  UpdateDeadlineDto 
} from '@quickprolaw/shared-interfaces';

interface DeadlineState {
  deadlines: IDeadline[];
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class DeadlineService {
  private http = inject(HttpClient);
  // Following the same URL pattern as EndorsementsService
  private url = baseURL + 'matters'; 

  private state = signal<DeadlineState>({
    deadlines: [],
    loading: false,
    error: null,
  });

  public deadlines = computed(() => this.state().deadlines);
  public loading = computed(() => this.state().loading);

  /**
   * Load all deadlines for a specific matter
   */
  loadDeadlines(matterId: string): Observable<IDeadline[]> {
    this.state.update(s => ({ ...s, loading: true, deadlines: [] }));

    return this.http.get<IDeadline[]>(`${this.url}/${matterId}/deadlines`).pipe(
      tap(deadlines => {
        this.state.update(s => ({ ...s, deadlines, loading: false }));
      }),
      catchError(err => {
        this.state.update(s => ({ ...s, error: 'Failed to load deadlines.', loading: false }));
        return of([]);
      })
    );
  }

  /**
   * Create a new deadline
   */
  createDeadline(dto: CreateDeadlineDto): Observable<IDeadline> {
    this.state.update(s => ({ ...s, loading: true }));

    if (!dto.matterId) {
      throw new Error('matterId is required to create a deadline.');
    }

    return this.http.post<IDeadline>(`${this.url}/${dto.matterId}/deadlines`, dto).pipe(
      tap((newDeadline) => {
        this.state.update(s => ({
          ...s,
          deadlines: [newDeadline, ...s.deadlines],
          loading: false,
        }));
      }),
      catchError((err) => {
        this.state.update(s => ({ ...s, error: 'Failed to create deadline.', loading: false }));
        throw err;
      })
    );
  }

  /**
   * Update an existing deadline
   */
  updateDeadline(id: string, dto: UpdateDeadlineDto, matterId: string): Observable<IDeadline> {
    this.state.update(s => ({ ...s, loading: true }));

    if (!matterId) {
      throw new Error('matterId is required to update a deadline.');
    }

    return this.http.put<IDeadline>(`${this.url}/${matterId}/deadlines/${id}`, dto).pipe(
      tap((updatedDeadline) => {
        this.state.update(s => ({
          ...s,
          deadlines: s.deadlines.map(d => d.id === id ? updatedDeadline : d),
          loading: false,
        }));
      }),
      catchError((err) => {
        this.state.update(s => ({ ...s, error: 'Failed to update deadline.', loading: false }));
        throw err;
      })
    );
  }

  /**
   * Delete a deadline
   */
  deleteDeadline(matterId: string, deadlineId: string): Observable<void> {
    this.state.update(s => ({ ...s, loading: true }));

    return this.http.delete<void>(`${this.url}/${matterId}/deadlines/${deadlineId}`).pipe(
      tap(() => {
        this.state.update(s => ({
          ...s,
          deadlines: s.deadlines.filter(d => d.id !== deadlineId),
          loading: false,
        }));
      }),
      catchError((err) => {
        this.state.update(s => ({ ...s, error: 'Failed to delete deadline.', loading: false }));
        throw err;
      })
    );
  }
}