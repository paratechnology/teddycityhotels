import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IAdminUser, baseURL } from '@teddy-city-hotels/shared-interfaces';

export interface AdminLoginResponse {
  token: string;
  user: IAdminUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  adminLogin(email: string, password: string): Observable<AdminLoginResponse> {
    return this.http.post<AdminLoginResponse>(`${baseURL}auth/admin-login`, { email, password });
  }

  requestPasswordReset(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${baseURL}auth/request-password-reset`, { email });
  }

  resetPasswordWithCode(payload: { email: string; code: string; newPassword: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${baseURL}auth/reset-password`, payload);
  }
}
