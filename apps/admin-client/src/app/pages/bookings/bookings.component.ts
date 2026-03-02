import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Booking, BookingStatus, Room } from '@teddy-city-hotels/shared-interfaces';
import { BookingService } from '../../services/booking.service';
import { RoomService } from '../../services/room.service';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.scss'],
})
export class BookingsComponent implements OnInit {
  bookings: Booking[] = [];
  rooms: Room[] = [];
  loading = false;
  error = '';
  bookingForm: FormGroup;

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
      guestEmail: ['', Validators.email],
      guestPhone: [''],
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.loadRooms();
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading = true;
    this.bookingService.getBookings().subscribe({
      next: (bookings) => {
        this.bookings = bookings;
        this.loading = false;
      },
      error: (error) => {
        this.error = error?.error?.message || 'Failed to load bookings.';
        this.loading = false;
      },
    });
  }

  loadRooms(): void {
    this.roomService.getRooms().subscribe({
      next: (rooms) => {
        this.rooms = rooms;
      },
    });
  }

  createManualBooking(): void {
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      return;
    }

    this.bookingService.addBooking(this.bookingForm.getRawValue() as any).subscribe({
      next: () => {
        this.bookingForm.reset({ numberOfGuests: 1 });
        this.loadBookings();
      },
      error: (error) => {
        this.error = error?.error?.message || 'Failed to create booking.';
      },
    });
  }

  updateStatus(booking: Booking, status: BookingStatus): void {
    this.bookingService.updateBookingStatus(booking.id, status).subscribe({
      next: () => this.loadBookings(),
      error: (error) => {
        this.error = error?.error?.message || 'Failed to update booking status.';
      },
    });
  }

  formatDate(input: unknown): string {
    if (!input) {
      return '-';
    }

    if (typeof input === 'object' && input !== null && 'toDate' in (input as { toDate: () => Date })) {
      return (input as { toDate: () => Date }).toDate().toLocaleString();
    }

    const date = new Date(input as string);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleString();
  }
}
