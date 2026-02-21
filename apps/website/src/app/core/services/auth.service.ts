import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { IAuthResponse, baseURL } from '@teddy-city-hotels/shared-interfaces';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private authUrl = `${baseURL}auth/`;

  acceptInvitation(dto: any): Observable<IAuthResponse> {
    return this.http.post<IAuthResponse>(`${this.authUrl}accept-invitation`, dto);
  }

  requestAccountDeletion(email: string): Observable<any> {
    return this.http.post(`${this.authUrl}request-deletion`, { email });
  }

  confirmAccountDeletion(token: string): Observable<any> {
    return this.http.post(`${this.authUrl}confirm-deletion`, { token });
  }
}
