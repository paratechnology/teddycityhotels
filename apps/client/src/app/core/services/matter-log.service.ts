import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { baseURL, ICreateMatterLog, IMatterLogEntry } from '@quickprolaw/shared-interfaces';

@Injectable({
  providedIn: 'root'
})
export class MatterLogService {
  private http = inject(HttpClient);
  private url = baseURL + 'matters';

  getLogEntries(matterId: string): Observable<IMatterLogEntry[]> {
    return this.http.get<IMatterLogEntry[]>(`${this.url}/${matterId}/log`);
  }

  createLogEntry(matterId: string, dto: ICreateMatterLog): Observable<IMatterLogEntry> {
    return this.http.post<IMatterLogEntry>(`${this.url}/${matterId}/log`, dto);
  }
}