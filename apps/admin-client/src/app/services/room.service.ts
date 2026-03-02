import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Room, UpsertRoomDto, baseURL } from '@teddy-city-hotels/shared-interfaces';

@Injectable({
  providedIn: 'root',
})
export class RoomService {
  private roomsUrl = `${baseURL}rooms`;

  constructor(private http: HttpClient) {}

  getRooms(): Observable<Room[]> {
    return this.http.get<Room[]>(this.roomsUrl);
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
