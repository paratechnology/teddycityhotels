import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { RoomService } from '../rooms/room.service';
import { Room } from '@teddy-city-hotels/shared-interfaces';
import { Observable, switchMap } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BookingService } from './booking.service';
import { BookingResponse } from './booking.response.interface';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss']
})
export class BookingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private roomService = inject(RoomService);
  private bookingService = inject(BookingService);
  private fb = inject(FormBuilder);

  room$!: Observable<Room>;
  bookingForm = this.fb.group({
    checkInDate: ['', Validators.required],
    checkOutDate: ['', Validators.required],
    numberOfGuests: [1, [Validators.required, Validators.min(1)]]
  });

  ngOnInit(): void {
    const roomId = this.route.snapshot.paramMap.get('roomId');
    if (roomId) {
      this.room$ = this.roomService.getRoomById(roomId);
    }
  }

  onSubmit() {
    if (this.bookingForm.valid) {
      this.room$.pipe(
        switchMap(room => {
          const bookingData = {
            ...this.bookingForm.value,
            roomId: room.id,
          };
          return this.bookingService.createBooking(bookingData);
        })
      ).subscribe((response: BookingResponse) => {
        window.location.href = response.paymentData.authorization_url;
      });
    }
  }
}
