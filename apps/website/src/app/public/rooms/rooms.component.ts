import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Room } from '@teddy-city-hotels/shared-interfaces';
import { RoomService } from './room.service';
import { Observable } from 'rxjs';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.scss']
})
export class RoomsComponent implements OnInit {
  private roomService = inject(RoomService);
  rooms$!: Observable<Room[]>;

  ngOnInit(): void {
    this.rooms$ = this.roomService.getAllRooms();
  }
}
