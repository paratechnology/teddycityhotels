import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Room } from '@teddy-city-hotels/shared-interfaces';
import { RoomService } from '../../services/room.service';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.scss'],
})
export class RoomsComponent implements OnInit {
  rooms: Room[] = [];
  loading = false;
  error = '';

  page = 1;
  pageSize = 10;
  total = 0;

  search = '';
  typeFilter: Room['type'] | '' = '';
  availabilityFilter: '' | 'true' | 'false' = '';

  readonly roomTypes: Array<Room['type']> = ['Single', 'Double', 'Suite', 'Penthouse'];

  constructor(private roomService: RoomService) {}

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  ngOnInit(): void {
    this.loadRooms();
  }

  loadRooms(): void {
    this.loading = true;
    this.error = '';

    this.roomService
      .getAdminRooms({
        page: this.page,
        pageSize: this.pageSize,
        search: this.search,
        type: this.typeFilter,
        isAvailable: this.availabilityFilter,
      })
      .subscribe({
        next: (response) => {
          this.rooms = response.data;
          this.total = response.total;
          this.page = response.page;
          this.pageSize = response.pageSize;
          this.loading = false;
        },
        error: (error) => {
          this.error = error?.error?.message || 'Failed to load rooms.';
          this.loading = false;
        },
      });
  }

  applyFilters(): void {
    this.page = 1;
    this.loadRooms();
  }

  clearFilters(): void {
    this.page = 1;
    this.search = '';
    this.typeFilter = '';
    this.availabilityFilter = '';
    this.loadRooms();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.page) return;
    this.page = page;
    this.loadRooms();
  }

  deleteRoom(id: string): void {
    if (!confirm('Delete this room and all of its metadata?')) {
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

