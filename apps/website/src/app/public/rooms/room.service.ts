import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Room, baseURL } from '@teddy-city-hotels/shared-interfaces';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private http = inject(HttpClient);
  private baseUrl = `${baseURL}rooms`;

  getAllRooms(): Observable<Room[]> {
    return this.http.get<Room[]>(this.baseUrl);
  }

  getRoomById(roomId: string): Observable<Room> {
    return this.http.get<Room>(`${this.baseUrl}/${roomId}`);
  }
}
