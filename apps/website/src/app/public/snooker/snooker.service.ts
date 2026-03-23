import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  ICreatePublicSnookerRegistrationDto,
  ISnookerLeagueData,
  ISnookerRegistrationResponse,
  baseURL,
} from '@teddy-city-hotels/shared-interfaces';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PublicSnookerService {
  private http = inject(HttpClient);
  private readonly snookerUrl = `${baseURL}snooker`;

  getLeagueData(): Observable<ISnookerLeagueData> {
    return this.http.get<ISnookerLeagueData>(this.snookerUrl);
  }

  register(payload: ICreatePublicSnookerRegistrationDto): Observable<ISnookerRegistrationResponse> {
    return this.http.post<ISnookerRegistrationResponse>(`${this.snookerUrl}/register`, payload);
  }
}
