import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Room } from '@teddy-city-hotels/shared-interfaces';
import { RoomService } from '../../services/room.service';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.scss'],
})
export class RoomsComponent implements OnInit {
  rooms: Room[] = [];
  loading = false;
  error = '';

  constructor(private roomService: RoomService) {}

  ngOnInit(): void {
    this.loadRooms();
  }

  loadRooms(): void {
    this.loading = true;
    this.error = '';

    this.roomService.getRooms().subscribe({
      next: (rooms) => {
        this.rooms = rooms;
        this.loading = false;
      },
      error: (error) => {
        this.error = error?.error?.message || 'Failed to load rooms.';
        this.loading = false;
      },
    });
  }

  deleteRoom(id: string): void {
    if (!confirm('Are you sure you want to delete this room?')) {
      return;
    }

    this.roomService.deleteRoom(id).subscribe({
      next: () => this.loadRooms(),
      error: (error) => {
        this.error = error?.error?.message || 'Failed to delete room.';
      },
    });
  }
}
