import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { IAttendanceRecord, IAttendanceUserRecord, baseURL } from '@quickprolaw/shared-interfaces';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private http = inject(HttpClient);

  getDailyAttendance(date: string): Observable<IAttendanceRecord> {
    // The backend will get the firmId from the user's auth token
    const endpoint = `${baseURL}attendance/${date}`;
    return this.http.get<IAttendanceRecord>(endpoint);
  }

  getMyStatus(): Observable<Partial<IAttendanceUserRecord>> {
    const endpoint = `${baseURL}attendance/status/my-today`;
    return this.http.get<Partial<IAttendanceUserRecord>>(endpoint);
  }
}