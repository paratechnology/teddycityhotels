import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { Room } from '@teddy-city-hotels/shared-interfaces';
import { RoomService } from '../../services/room.service';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.scss']
})
export class RoomsComponent implements OnInit {

  rooms$!: Observable<Room[]>;

  constructor(private roomService: RoomService) { }

  ngOnInit(): void {
    this.loadRooms();
  }

  loadRooms(): void {
    this.rooms$ = this.roomService.getRooms();
  }

  deleteRoom(id: string): void {
    if (confirm('Are you sure you want to delete this room?')) {
      this.roomService.deleteRoom(id).subscribe(() => {
        this.loadRooms();
      });
    }
  }
}
