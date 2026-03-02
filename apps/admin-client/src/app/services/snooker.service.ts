import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ISnookerMatch, ISnookerPlayer, baseURL } from '@teddy-city-hotels/shared-interfaces';

@Injectable({
  providedIn: 'root',
})
export class SnookerService {
  private snookerUrl = `${baseURL}snooker`;

  constructor(private http: HttpClient) {}

  getPlayers(): Observable<ISnookerPlayer[]> {
    return this.http.get<ISnookerPlayer[]>(`${this.snookerUrl}/players`);
  }

  addPlayer(player: ISnookerPlayer): Observable<ISnookerPlayer> {
    return this.http.post<ISnookerPlayer>(`${this.snookerUrl}/players`, player);
  }

  updatePlayer(player: ISnookerPlayer): Observable<ISnookerPlayer> {
    return this.http.put<ISnookerPlayer>(`${this.snookerUrl}/players/${player.id}`, player);
  }

  deletePlayer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.snookerUrl}/players/${id}`);
  }

  getMatches(): Observable<ISnookerMatch[]> {
    return this.http.get<ISnookerMatch[]>(`${this.snookerUrl}/matches`);
  }

  addMatch(match: ISnookerMatch): Observable<ISnookerMatch> {
    return this.http.post<ISnookerMatch>(`${this.snookerUrl}/matches`, match);
  }

  updateMatch(match: ISnookerMatch): Observable<ISnookerMatch> {
    return this.http.put<ISnookerMatch>(`${this.snookerUrl}/matches/${match.id}`, match);
  }

  deleteMatch(id: string): Observable<void> {
    return this.http.delete<void>(`${this.snookerUrl}/matches/${id}`);
  }
}
