import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Room } from '@teddy-city-hotels/shared-interfaces';
import { ROOMS_DATA } from './rooms.data';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.scss']
})
export class RoomsComponent {
  rooms: Room[] = ROOMS_DATA;
}
