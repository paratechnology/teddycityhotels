import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { CreateGeneralFileDto, IGeneralFile, IGeneralFileLogEntry, IPhysicalFileItem, PaginatedResponse, baseURL } from '@quickprolaw/shared-interfaces';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeneralFileService {
  private http = inject(HttpClient);
  private generalFilesUrl = `${baseURL}general-files`;

  getFiles(filters: { page?: number; pageSize?: number; search?: string; }): Observable<PaginatedResponse<IGeneralFile>> {
    let params = new HttpParams();
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.pageSize) params = params.set('pageSize', filters.pageSize.toString());
    if (filters.search) params = params.set('search', filters.search);

    return this.http.get<PaginatedResponse<IGeneralFile>>(this.generalFilesUrl, { params });
  }

  createFile(dto: CreateGeneralFileDto): Observable<IGeneralFile> {
    return this.http.post<IGeneralFile>(this.generalFilesUrl, dto);
  }

  getAllPhysicalFiles(filters: { page?: number; pageSize?: number; search?: string; }): Observable<PaginatedResponse<IPhysicalFileItem>> {
    let params = new HttpParams();
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.pageSize) params = params.set('pageSize', filters.pageSize.toString());
    if (filters.search) params = params.set('search', filters.search);

    // This endpoint aggregates both General and Matter files.
    return this.http.get<PaginatedResponse<IPhysicalFileItem>>(`${this.generalFilesUrl}/all-physical`, { params });
  }

  initiateTransfer(fileId: string, toUserId: string): Observable<IGeneralFileLogEntry> {
    return this.http.post<IGeneralFileLogEntry>(`${this.generalFilesUrl}/${fileId}/transfer`, { toUserId });
  }

  confirmTransfer(fileId: string, logId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.generalFilesUrl}/${fileId}/log/${logId}/confirm`, {});
  }

  getLog(fileId: string): Observable<IGeneralFileLogEntry[]> {
    return this.http.get<IGeneralFileLogEntry[]>(`${this.generalFilesUrl}/${fileId}/log`);
  }

  getPendingForFirm(): Observable<IGeneralFileLogEntry[]> {
    return this.http.get<IGeneralFileLogEntry[]>(`${this.generalFilesUrl}/pending`);
  }

  cancelTransfer(fileId: string, logId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.generalFilesUrl}/${fileId}/log/${logId}/cancel`, {});
  }

  returnToFileRoom(fileId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.generalFilesUrl}/${fileId}/return`, {});
  }

  directTransfer(fileId: string, toUserId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.generalFilesUrl}/${fileId}/direct-transfer`, { toUserId });
  }


  rejectTransfer(fileId: string,  logId:string): Observable<{ message: string}> {
    return this.http.post<{ message: string }>(`${this.generalFilesUrl}/${fileId}/file-log/${logId}/reject`, {});
  }
}