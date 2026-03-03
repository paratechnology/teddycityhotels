import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  IAdminUser,
  ICreateAdminUserDto,
  IUpdateAdminUserDto,
  PaginatedResponse,
  baseURL,
} from '@teddy-city-hotels/shared-interfaces';

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private adminUsersUrl = `${baseURL}admin/users`;

  constructor(private http: HttpClient) {}

  me(): Observable<IAdminUser> {
    return this.http.get<IAdminUser>(`${this.adminUsersUrl}/me`);
  }

  list(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Observable<IAdminUser[] | PaginatedResponse<IAdminUser>> {
    if (!params || (!params.page && !params.pageSize && !params.search)) {
      return this.http.get<IAdminUser[]>(this.adminUsersUrl);
    }

    const query = new URLSearchParams({
      page: String(params.page || 1),
      pageSize: String(params.pageSize || 12),
    });
    if (params.search?.trim()) query.set('search', params.search.trim());

    return this.http.get<PaginatedResponse<IAdminUser>>(`${this.adminUsersUrl}?${query.toString()}`);
  }

  create(payload: ICreateAdminUserDto): Observable<IAdminUser> {
    return this.http.post<IAdminUser>(this.adminUsersUrl, payload);
  }

  update(id: string, payload: IUpdateAdminUserDto): Observable<IAdminUser> {
    return this.http.patch<IAdminUser>(`${this.adminUsersUrl}/${id}`, payload);
  }
}
