import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Booking } from '@teddy-city-hotels/shared-interfaces';
import { BookingService } from '../../services/booking.service';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.scss']
})
export class BookingsComponent implements OnInit {

  bookings$!: Observable<Booking[]>;

  constructor(private bookingService: BookingService) { }

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.bookings$ = this.bookingService.getBookings();
  }

  cancelBooking(booking: Booking): void {
    if (confirm('Are you sure you want to cancel this booking?')) {
      const updatedBooking = { ...booking, status: 'cancelled' as const };
      this.bookingService.updateBooking(updatedBooking).subscribe(() => {
        this.loadBookings();
      });
    }
  }
}
