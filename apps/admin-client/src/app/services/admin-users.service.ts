import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  IAdminUser,
  ICreateAdminUserDto,
  IUpdateAdminUserDto,
  baseURL,
} from '@teddy-city-hotels/shared-interfaces';

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private adminUsersUrl = `${baseURL}admin/users`;

  constructor(private http: HttpClient) {}

  me(): Observable<IAdminUser> {
    return this.http.get<IAdminUser>(`${this.adminUsersUrl}/me`);
  }

  list(): Observable<IAdminUser[]> {
    return this.http.get<IAdminUser[]>(this.adminUsersUrl);
  }

  create(payload: ICreateAdminUserDto): Observable<IAdminUser> {
    return this.http.post<IAdminUser>(this.adminUsersUrl, payload);
  }

  update(id: string, payload: IUpdateAdminUserDto): Observable<IAdminUser> {
    return this.http.patch<IAdminUser>(`${this.adminUsersUrl}/${id}`, payload);
  }
}
