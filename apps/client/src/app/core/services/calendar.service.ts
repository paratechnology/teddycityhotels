import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { ICalendarAppEvent, baseURL, CreateCalendarEventDto, UpdateCalendarEventDto, IFirmUserSubset } from '@quickprolaw/shared-interfaces';
import { Observable } from 'rxjs';

interface CalendarState {
  events: ICalendarAppEvent[];
  status: 'loading' | 'success' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private http = inject(HttpClient);
  private calendarUrl = `${baseURL}calendar`;

  #state = signal<CalendarState>({
    events: [],
    status: 'loading',
  });

  public events = computed(() => this.#state().events);
  public status = computed(() => this.#state().status);

  // --- Public Methods ---

  loadEvents(viewStartDate: Date, viewEndDate: Date) {
    this.#state.update(s => ({ ...s, status: 'loading' }));

    const params = new HttpParams()
      .set('start', viewStartDate.toISOString()) // beginning of the day
      .set('end', new Date(viewEndDate.getTime() + (24 * 60 * 60 * 1000) -1).toISOString()); // end of the day

    this.http.get<ICalendarAppEvent[]>(this.calendarUrl, { params }).subscribe({
      next: (events) => {
        this.#state.set({ events, status: 'success' });
      },
      error: () => {
        this.#state.update(s => ({ ...s, status: 'error' }));
      }
    });
  }

  createEvent(dto: CreateCalendarEventDto): Observable<ICalendarAppEvent> {
    return this.http.post<ICalendarAppEvent>(this.calendarUrl, dto);
  }

  bulkUpsertEvents(payload: { eventsToCreate: CreateCalendarEventDto[], eventsToUpdate: UpdateCalendarEventDto[] }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.calendarUrl}/bulk-upsert`, payload);
  }

  updateEvent(id: string, dto: UpdateCalendarEventDto): Observable<ICalendarAppEvent> {
    return this.http.patch<ICalendarAppEvent>(`${this.calendarUrl}/${id}`, dto);
  }

  deleteEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.calendarUrl}/${id}`);
  }

  getAttendanceHistory(matterId: string, beforeDate: string): Observable<ICalendarAppEvent | null> {
    const params = new HttpParams().set('beforeDate', beforeDate);

    return this.http.get<ICalendarAppEvent | null>(`${this.calendarUrl}/history/${matterId}`, { params });
  }

  getEventsForMatter(matterId: string): Observable<ICalendarAppEvent[]> {
    return this.http.get<ICalendarAppEvent[]>(`${this.calendarUrl}/matter/${matterId}`);
  }

  getUsersInCourtOnDate(date: string): Observable<IFirmUserSubset[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<IFirmUserSubset[]>(`${this.calendarUrl}/users-in-court`, { params });
  }

  notifyTeamOfWeeklyCalendar(): Observable<void> {
    return this.http.post<void>(`${this.calendarUrl}/notify-weekly`, {});    
  }

  downloadWeeklyDocket(payload: { events: ICalendarAppEvent[], weekRange: string}): Observable<Blob> {
    // calling your backend endpoint that uses the pdfService
    return this.http.post(`${this.calendarUrl}/export/docket`, payload, { responseType: 'blob' });
  }
}
