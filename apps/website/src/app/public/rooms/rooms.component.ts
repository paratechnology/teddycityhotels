import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { IProperty, Room } from '@teddy-city-hotels/shared-interfaces';
import { RoomService } from './room.service';
import { Observable } from 'rxjs';
import { RouterModule } from '@angular/router';
import { PropertyContextService } from '../properties/property-context.service';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.scss']
})
export class RoomsComponent implements OnInit {
  private roomService = inject(RoomService);
  private propertyContext = inject(PropertyContextService);
  private destroyRef = inject(DestroyRef);

  rooms$!: Observable<Room[]>;
  property: IProperty | null = null;

  ngOnInit(): void {
    this.rooms$ = this.roomService.getAllRooms();
    this.propertyContext.active$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((property) => {
        this.property = property;
      });
  }
}
