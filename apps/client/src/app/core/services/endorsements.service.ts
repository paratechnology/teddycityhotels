import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { baseURL, IEndorsement } from '@quickprolaw/shared-interfaces';

interface EndorsementsState {
  endorsements: IEndorsement[];
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class EndorsementsService {
  private http = inject(HttpClient);
  private url = baseURL + 'matters'; // The base URL is now 'matters'
  private state = signal<EndorsementsState>({
    endorsements: [],
    loading: false,
    error: null,
  });

  public endorsements = computed(() => this.state().endorsements);
  public loading = computed(() => this.state().loading);

  /**
   * Manually sets the endorsements in the state.
   * Useful for populating data from aggregated endpoints.
   */
  setEndorsements(endorsements: IEndorsement[]) {
    this.state.update(s => ({ ...s, endorsements, loading: false }));
  }

  loadEndorsements(matterId: string): Observable<IEndorsement[]> {
    this.state.update(s => ({ ...s, loading: true, endorsements: [] }));

    return this.http.get<IEndorsement[]>(`${this.url}/${matterId}/endorsements`).pipe(
      tap(endorsements => {
        this.state.update(s => ({ ...s, endorsements, loading: false }));
      }),
      catchError(err => {
        this.state.update(s => ({ ...s, error: 'Failed to load endorsements.', loading: false }));
        return of([]);
      })
    );
  }


  // --- TRANSACTIONAL METHODS ---

  /**
   * Aliases the create operation to match the Component's expected method name.
   * Maps { endorsement, adjournment } -> { endorsement, adjournments: [] }
   */
  createWithTransaction(matterId: string, payload: { endorsementData: any, adjournments?: any }): Observable<IEndorsement> {
    const backendPayload = {
      endorsement: payload.endorsementData,
      adjournments: payload.adjournments ? payload.adjournments : []
    };

    return this.createEndorsement(matterId, backendPayload);
  }

  /**
   * Aliases the update operation to match the Component's expected method name.
   * Maps { endorsement, adjournment } -> { endorsement, adjournments: [] }
   */
  updateWithTransaction(id: string, matterId: string, payload: { endorsementData: any, adjournment?: any }): Observable<IEndorsement> {
    const backendPayload = {
      endorsement: payload.endorsementData,
      adjournments: payload.adjournment ? [payload.adjournment] : []
    };
    return this.updateEndorsement(id, matterId, backendPayload);
  }



  /**
     * Sends { endorsement, adjournments } in a single POST request
     */
  createEndorsement(matterId: string, payload: { endorsement: any, adjournments: any[] }): Observable<IEndorsement> {
    return this.http.post<IEndorsement>(`${this.url}/${matterId}/endorsements`, payload);
  }

  /**
   * Sends { endorsement, adjournments } in a single PUT request
   */
  updateEndorsement(id: string, matterId: string, payload: { endorsement: any, adjournments: any[] }): Observable<IEndorsement> {
    return this.http.put<IEndorsement>(`${this.url}/${matterId}/endorsements/${id}`, payload);
  }


  deleteEndorsement(matterId: string, endorsementId: string): Observable<void> {

    return this.http.delete<void>(`${this.url}/${matterId}/endorsements/${endorsementId}`).pipe(
      tap(() => {
        // 2. SUCCESS: The server is happy, so NOW we remove it from the screen.
        this.state.update(s => ({
          ...s,
          endorsements: s.endorsements.filter(e => e.id !== endorsementId)
        }));
      }),
      catchError((err) => {
        // 3. ERROR: The server failed. We do nothing to the list. 
        // The item never left the screen.
        // Optionally set an error message for a toast
        this.state.update(s => ({ ...s, error: 'Could not delete item.' }));
        throw err;
      })
    );
  }


  upsertEndorsement(endorsement: IEndorsement) {
    this.state.update((s) => {
      // Check if it exists (Update) or is new (Insert)
      const index = s.endorsements.findIndex(e => e.id === endorsement.id);
      let updatedList = [...s.endorsements];

      if (index > -1) {
        // Update existing
        updatedList[index] = endorsement;
      } else {
        // Add new (to top)
        updatedList = [endorsement, ...updatedList];
      }

      // Optional: Sort by date descending to keep timeline correct
      updatedList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return { ...s, endorsements: updatedList };
    });
  }

}