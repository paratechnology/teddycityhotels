import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ISnookerMatch, ISnookerPlayer } from '@teddy-city-hotels/shared-interfaces';
import { SnookerService } from '../../services/snooker.service';

@Component({
  selector: 'app-snooker',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './snooker.component.html',
  styleUrls: ['./snooker.component.scss'],
})
export class SnookerComponent implements OnInit {
  players: ISnookerPlayer[] = [];
  matches: ISnookerMatch[] = [];
  error = '';
  playerForm: FormGroup;
  matchForm: FormGroup;

  constructor(private snookerService: SnookerService, private fb: FormBuilder) {
    this.playerForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', Validators.required],
      skillLevel: ['Beginner' as ISnookerPlayer['skillLevel'], Validators.required],
    });

    this.matchForm = this.fb.group({
      player1Id: ['', Validators.required],
      player2Id: ['', Validators.required],
      dateScheduled: ['', Validators.required],
      stage: ['Group', Validators.required],
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.snookerService.getPlayers().subscribe({ next: (players) => (this.players = players) });
    this.snookerService.getMatches().subscribe({ next: (matches) => (this.matches = matches) });
  }

  createPlayer(): void {
    if (this.playerForm.invalid) {
      this.playerForm.markAllAsTouched();
      return;
    }

    const value = this.playerForm.getRawValue();
    const payload: ISnookerPlayer = {
      id: '',
      fullName: value['fullName'] || '',
      email: value['email'] || '',
      phoneNumber: value['phoneNumber'] || '',
      skillLevel: value['skillLevel'] || 'Beginner',
      registeredAt: new Date().toISOString(),
      isPaid: true,
      stats: { played: 0, won: 0, lost: 0, points: 0 },
    };

    this.snookerService.addPlayer(payload).subscribe({
      next: () => {
        this.playerForm.reset({ skillLevel: 'Beginner' });
        this.load();
      },
      error: (error) => {
        this.error = error?.error?.message || 'Failed to create player.';
      },
    });
  }

  deletePlayer(id: string): void {
    this.snookerService.deletePlayer(id).subscribe({
      next: () => this.load(),
      error: (error) => {
        this.error = error?.error?.message || 'Failed to delete player.';
      },
    });
  }

  createMatch(): void {
    if (this.matchForm.invalid) {
      this.matchForm.markAllAsTouched();
      return;
    }

    const value = this.matchForm.getRawValue();
    const player1 = this.players.find((player) => player.id === value['player1Id']);
    const player2 = this.players.find((player) => player.id === value['player2Id']);

    if (!player1 || !player2) {
      this.error = 'Select valid players.';
      return;
    }

    const payload: ISnookerMatch = {
      id: '',
      player1: { id: player1.id, name: player1.fullName },
      player2: { id: player2.id, name: player2.fullName },
      dateScheduled: value['dateScheduled'] || '',
      status: 'Scheduled',
      stage: value['stage'] || 'Group',
    };

    this.snookerService.addMatch(payload).subscribe({
      next: () => {
        this.matchForm.reset({ stage: 'Group' });
        this.load();
      },
      error: (error) => {
        this.error = error?.error?.message || 'Failed to create match.';
      },
    });
  }

  setMatchStatus(match: ISnookerMatch, status: ISnookerMatch['status']): void {
    this.snookerService.updateMatch({ ...match, status }).subscribe({
      next: () => this.load(),
      error: (error) => {
        this.error = error?.error?.message || 'Failed to update match.';
      },
    });
  }
}
