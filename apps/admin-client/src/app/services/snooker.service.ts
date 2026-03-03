import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ICreateSnookerCompetitionDto,
  IGenerateSnookerGroupsDto,
  IRecordSnookerResultDto,
  ISnookerCompetitionState,
  ISnookerPlayer,
  PaginatedResponse,
  baseURL,
} from '@teddy-city-hotels/shared-interfaces';

@Injectable({
  providedIn: 'root',
})
export class SnookerService {
  private snookerUrl = `${baseURL}snooker`;

  constructor(private http: HttpClient) {}

  getCompetitionState(params?: {
    playersPage?: number;
    playersPageSize?: number;
    playersSearch?: string;
    matchesPage?: number;
    matchesPageSize?: number;
  }): Observable<ISnookerCompetitionState> {
    const query = new URLSearchParams();
    if (params?.playersPage) query.set('playersPage', String(params.playersPage));
    if (params?.playersPageSize) query.set('playersPageSize', String(params.playersPageSize));
    if (params?.playersSearch?.trim()) query.set('playersSearch', params.playersSearch.trim());
    if (params?.matchesPage) query.set('matchesPage', String(params.matchesPage));
    if (params?.matchesPageSize) query.set('matchesPageSize', String(params.matchesPageSize));

    const suffix = query.size ? `?${query.toString()}` : '';
    return this.http.get<ISnookerCompetitionState>(`${this.snookerUrl}/competition${suffix}`);
  }

  createCompetition(payload: ICreateSnookerCompetitionDto): Observable<ISnookerCompetitionState> {
    return this.http.post<ISnookerCompetitionState>(`${this.snookerUrl}/competition`, payload);
  }

  generateGroups(payload: IGenerateSnookerGroupsDto): Observable<ISnookerCompetitionState> {
    return this.http.post<ISnookerCompetitionState>(`${this.snookerUrl}/competition/generate-groups`, payload);
  }

  startKnockoutStage(): Observable<ISnookerCompetitionState> {
    return this.http.post<ISnookerCompetitionState>(`${this.snookerUrl}/competition/start-knockout`, {});
  }

  registerPlayer(payload: ISnookerPlayer): Observable<ISnookerPlayer> {
    return this.http.post<ISnookerPlayer>(`${this.snookerUrl}/players`, payload);
  }

  getPlayers(params: {
    page: number;
    pageSize: number;
    search?: string;
  }): Observable<PaginatedResponse<ISnookerPlayer>> {
    const query = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize),
    });
    if (params.search?.trim()) query.set('search', params.search.trim());

    return this.http.get<PaginatedResponse<ISnookerPlayer>>(`${this.snookerUrl}/players?${query.toString()}`);
  }

  deletePlayer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.snookerUrl}/players/${id}`);
  }

  recordMatchResult(matchId: string, payload: IRecordSnookerResultDto): Observable<ISnookerCompetitionState> {
    return this.http.post<ISnookerCompetitionState>(`${this.snookerUrl}/matches/${matchId}/result`, payload);
  }
}

