import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Room } from '@teddy-city-hotels/shared-interfaces';
import { baseURL } from '@teddy-city-hotels/shared-interfaces';

@Injectable({
  providedIn: 'root'
})
export class RoomService {

  private roomsUrl = `${baseURL}rooms`;

  constructor(private http: HttpClient) { }

  getRooms(): Observable<Room[]> {
    return this.http.get<Room[]>(this.roomsUrl);
  }

  getRoom(id: string): Observable<Room> {
    const url = `${this.roomsUrl}/${id}`;
    return this.http.get<Room>(url);
  }

  addRoom(room: Room): Observable<Room> {
    return this.http.post<Room>(this.roomsUrl, room);
  }

  updateRoom(room: Room): Observable<any> {
    const url = `${this.roomsUrl}/${room.id}`;
    return this.http.put(url, room);
  }

  deleteRoom(id: string): Observable<Room> {
    const url = `${this.roomsUrl}/${id}`;
    return this.http.delete<Room>(url);
  }
}
