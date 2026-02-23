import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { ISnookerPlayer } from '@teddy-city-hotels/shared-interfaces';
import { SnookerService } from '../../services/snooker.service';

@Component({
  selector: 'app-snooker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './snooker.component.html',
  styleUrls: ['./snooker.component.scss']
})
export class SnookerComponent implements OnInit {

  players$!: Observable<ISnookerPlayer[]>;

  constructor(private snookerService: SnookerService) { }

  ngOnInit(): void {
    this.players$ = this.snookerService.getPlayers();
  }
}
