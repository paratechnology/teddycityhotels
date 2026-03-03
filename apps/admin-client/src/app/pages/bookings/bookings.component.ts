import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Booking, BookingStatus, Room } from '@teddy-city-hotels/shared-interfaces';
import { BookingService } from '../../services/booking.service';
import { RoomService } from '../../services/room.service';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.scss'],
})
export class BookingsComponent implements OnInit {
  bookings: Booking[] = [];
  rooms: Room[] = [];
  loading = false;
  error = '';

  page = 1;
  pageSize = 10;
  total = 0;

  search = '';
  statusFilter: BookingStatus | '' = '';
  roomFilter = '';

  showCreateModal = false;
  submitting = false;
  bookingForm: FormGroup;

  readonly statuses: Array<{ value: BookingStatus | ''; label: string }> = [
    { value: '', label: 'All statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'checked_in', label: 'Checked In' },
    { value: 'checked_out', label: 'Checked Out' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  constructor(
    private bookingService: BookingService,
    private roomService: RoomService,
    private fb: FormBuilder
  ) {
    this.bookingForm = this.fb.group({
      roomId: ['', Validators.required],
      checkInDate: ['', Validators.required],
      checkOutDate: ['', Validators.required],
      numberOfGuests: [1, [Validators.required, Validators.min(1)]],
      guestName: ['', Validators.required],
      guestEmail: ['', [Validators.email]],
      guestPhone: [''],
      notes: [''],
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  ngOnInit(): void {
    this.loadRooms();
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading = true;
    this.error = '';

    this.bookingService
      .getBookings({
        page: this.page,
        pageSize: this.pageSize,
        status: this.statusFilter,
        roomId: this.roomFilter || undefined,
        search: this.search || undefined,
      })
      .subscribe({
        next: (response) => {
          this.bookings = response.data;
          this.total = response.total;
          this.page = response.page;
          this.pageSize = response.pageSize;
          this.loading = false;
        },
        error: (error) => {
          this.error = error?.error?.message || 'Failed to load bookings.';
          this.loading = false;
        },
      });
  }

  loadRooms(): void {
    this.roomService.getRoomsCatalog().subscribe({
      next: (rooms) => {
        this.rooms = rooms;
      },
      error: (error) => {
        this.error = error?.error?.message || 'Failed to load room catalog.';
      },
    });
  }

  openCreateBooking(): void {
    this.showCreateModal = true;
    this.bookingForm.reset({
      roomId: '',
      checkInDate: '',
      checkOutDate: '',
      numberOfGuests: 1,
      guestName: '',
      guestEmail: '',
      guestPhone: '',
      notes: '',
    });
  }

  closeCreateBooking(): void {
    this.showCreateModal = false;
    this.submitting = false;
  }

  createManualBooking(): void {
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.bookingService.addBooking(this.bookingForm.getRawValue()).subscribe({
      next: () => {
        this.submitting = false;
        this.closeCreateBooking();
        this.page = 1;
        this.loadBookings();
      },
      error: (error) => {
        this.submitting = false;
        this.error = error?.error?.message || 'Failed to create booking.';
      },
    });
  }

  applyFilters(): void {
    this.page = 1;
    this.loadBookings();
  }

  clearFilters(): void {
    this.search = '';
    this.statusFilter = '';
    this.roomFilter = '';
    this.page = 1;
    this.loadBookings();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.page) {
      return;
    }
    this.page = page;
    this.loadBookings();
  }

  updateStatus(booking: Booking, status: BookingStatus): void {
    this.bookingService.updateBookingStatus(booking.id, status).subscribe({
      next: () => this.loadBookings(),
      error: (error) => {
        this.error = error?.error?.message || 'Failed to update booking status.';
      },
    });
  }

  roomName(roomId: string): string {
    return this.rooms.find((room) => room.id === roomId)?.name || roomId;
  }

  formatDate(input: unknown): string {
    if (!input) return '-';
    if (typeof input === 'object' && input !== null && 'toDate' in (input as { toDate: () => Date })) {
      return (input as { toDate: () => Date }).toDate().toLocaleString();
    }
    const date = new Date(input as string);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString();
  }
}
