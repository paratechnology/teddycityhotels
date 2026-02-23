import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ISnookerPlayer } from '@teddy-city-hotels/shared-interfaces';
import { baseURL } from '@teddy-city-hotels/shared-interfaces';

@Injectable({
  providedIn: 'root'
})
export class SnookerService {

  private snookerUrl = `${baseURL}snooker`;

  constructor(private http: HttpClient) { }

  getPlayers(): Observable<ISnookerPlayer[]> {
    return this.http.get<ISnookerPlayer[]>(`${this.snookerUrl}/players`);
  }

  getPlayer(id: string): Observable<ISnookerPlayer> {
    const url = `${this.snookerUrl}/players/${id}`;
    return this.http.get<ISnookerPlayer>(url);
  }

  addPlayer(player: ISnookerPlayer): Observable<ISnookerPlayer> {
    return this.http.post<ISnookerPlayer>(`${this.snookerUrl}/players`, player);
  }

  updatePlayer(player: ISnookerPlayer): Observable<any> {
    const url = `${this.snookerUrl}/players/${player.id}`;
    return this.http.put(url, player);
  }

  deletePlayer(id: string): Observable<ISnookerPlayer> {
    const url = `${this.snookerUrl}/players/${id}`;
    return this.http.delete<ISnookerPlayer>(url);
  }
}
