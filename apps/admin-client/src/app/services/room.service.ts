import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginatedResponse, Room, UpsertRoomDto, baseURL } from '@teddy-city-hotels/shared-interfaces';

@Injectable({
  providedIn: 'root',
})
export class RoomService {
  private roomsUrl = `${baseURL}rooms`;

  constructor(private http: HttpClient) {}

  getRoomsCatalog(): Observable<Room[]> {
    return this.http.get<Room[]>(this.roomsUrl);
  }

  getAdminRooms(params: {
    page: number;
    pageSize: number;
    search?: string;
    type?: Room['type'] | '';
    isAvailable?: '' | 'true' | 'false';
  }): Observable<PaginatedResponse<Room>> {
    const query = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize),
    });

    if (params.search?.trim()) query.set('search', params.search.trim());
    if (params.type) query.set('type', params.type);
    if (params.isAvailable) query.set('isAvailable', params.isAvailable);

    return this.http.get<PaginatedResponse<Room>>(`${this.roomsUrl}/admin?${query.toString()}`);
  }

  getRoom(id: string): Observable<Room> {
    return this.http.get<Room>(`${this.roomsUrl}/${id}`);
  }

  addRoom(room: UpsertRoomDto): Observable<Room> {
    return this.http.post<Room>(this.roomsUrl, room);
  }

  updateRoom(id: string, room: UpsertRoomDto): Observable<Room> {
    return this.http.put<Room>(`${this.roomsUrl}/${id}`, room);
  }

  deleteRoom(id: string): Observable<void> {
    return this.http.delete<void>(`${this.roomsUrl}/${id}`);
  }
}
