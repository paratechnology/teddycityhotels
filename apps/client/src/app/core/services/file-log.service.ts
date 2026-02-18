import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal ,} from '@angular/core';
import { IFileLogEntry, IPhysicalFileItem, PaginatedResponse, baseURL } from '@quickprolaw/shared-interfaces';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileLogService {
  private http = inject(HttpClient);
  public refreshNeeded = signal(false);


  initiateTransfer(matterId: string, toUserId: string): Observable<IFileLogEntry> {
    const endpoint = `${baseURL}matters/${matterId}/file-log/initiate`;
    return this.http.post<IFileLogEntry>(endpoint, { toUserId });
  }

  confirmTransfer(matterId: string, logId: string): Observable<{ message: string }> {
    const endpoint = `${baseURL}matters/${matterId}/file-log/${logId}/confirm`;
    return this.http.post<{ message: string }>(endpoint, {});
  }

  rejectTransfer(matterId: string, logId: string): Observable<{ message: string }> {
    const endpoint = `${baseURL}matters/${matterId}/file-log/${logId}/reject`;
    return this.http.post<{ message: string }>(endpoint, {});
  }

  cancelTransfer(matterId: string): Observable<{ message: string }> {
    const endpoint = `${baseURL}matters/${matterId}/file-log/cancel`;
    return this.http.post<{ message: string }>(endpoint, {});
  }

  getAllPhysicalMatters(filters: { page: number, pageSize: number, search?: string }): Observable<PaginatedResponse<IPhysicalFileItem>> {
    const endpoint = `${baseURL}/file-log`;

    let params = new HttpParams()
      .set('page', filters.page)
      .set('pageSize', filters.pageSize);
    if (filters.search) params = params.set('search', filters.search);

    return this.http.get<PaginatedResponse<IPhysicalFileItem>>(`${endpoint}/physical-index`, { params });
  }


  
    getPendingForFirm(): Observable<IFileLogEntry[]> {
    return this.http.get<IFileLogEntry[]>(`${baseURL}file-log/pending`);
  }

  getLogForMatter(matterId: string): Observable<IFileLogEntry[]> {
    return this.http.get<IFileLogEntry[]>(`${baseURL}file-log/matter/${matterId}`);
  }

  directTransfer(matterId: string, toUserId: string): Observable<{ message: string }> {
    const endpoint = `${baseURL}file-log/matter/${matterId}/direct-transfer`;
    return this.http.post<{ message: string }>(endpoint, { toUserId });
  }

  returnToFileRoom(matterId: string): Observable<{ message: string }> {
    const endpoint = `${baseURL}matters/${matterId}/file-log/return`;
    return this.http.post<{ message: string }>(endpoint, {});
  }
}