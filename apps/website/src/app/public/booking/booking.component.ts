import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss'],
})
export class BookingComponent {
  // Placeholder data for booking form
  checkInDate: string = '';
  checkOutDate: string = '';
  adults: number = 1;
  children: number = 0;
  roomType: string = 'standard';

  submitBooking() {
    console.log('Booking submitted:', {
      checkIn: this.checkInDate,
      checkOut: this.checkOutDate,
      adults: this.adults,
      children: this.children,
      roomType: this.roomType
    });
    alert('Booking request received! (This is a demo)');
  }
}