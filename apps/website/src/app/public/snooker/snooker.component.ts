import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ISnookerLeagueData, ISnookerPlayerRegistration } from '@teddy-city-hotels/shared-interfaces';

@Component({
  selector: 'app-snooker',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTabsModule,
    MatIconModule,
    MatSnackBarModule,
    MatCardModule,
    MatTableModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './snooker.component.html',
  styleUrls: ['./snooker.component.scss'],
})
export class SnookerComponent implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  registrationForm: FormGroup;
  isSubmitting = false;
  
  // Mock Data for UI development - this would come from a service in production
  leagueData: ISnookerLeagueData = {
    seasonName: '2025 Winter Championship',
    groups: [
      {
        id: 'g1',
        name: 'Group A',
        players: [
          { id: 'p1', fullName: 'Chinedu O.', email: '', phoneNumber: '', skillLevel: 'Pro', registeredAt: '', isPaid: true, stats: { played: 5, won: 4, lost: 1, points: 12 } },
          { id: 'p2', fullName: 'Sarah J.', email: '', phoneNumber: '', skillLevel: 'Intermediate', registeredAt: '', isPaid: true, stats: { played: 5, won: 3, lost: 2, points: 9 } },
          { id: 'p3', fullName: 'Mike R.', email: '', phoneNumber: '', skillLevel: 'Pro', registeredAt: '', isPaid: true, stats: { played: 5, won: 2, lost: 3, points: 6 } },
          { id: 'p4', fullName: 'David B.', email: '', phoneNumber: '', skillLevel: 'Intermediate', registeredAt: '', isPaid: true, stats: { played: 5, won: 1, lost: 4, points: 3 } },
        ]
      }
    ],
    matches: [
      {
        id: 'm1',
        player1: { id: 'p1', name: 'Chinedu O.' },
        player2: { id: 'p2', name: 'Sarah J.' },
        dateScheduled: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
        status: 'Scheduled',
        stage: 'Group A'
      },
      {
        id: 'm2',
        player1: { id: 'p3', name: 'Mike R.' },
        player2: { id: 'p4', name: 'David B.' },
        score: { p1: 3, p2: 1 },
        dateScheduled: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
        status: 'Completed',
        stage: 'Group A'
      }
    ]
  };

  displayedColumns: string[] = ['position', 'name', 'played', 'won', 'lost', 'points'];

  constructor() {
    this.registrationForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]+$/)]],
      nickname: [''],
      skillLevel: ['Beginner', Validators.required]
    });
  }

  ngOnInit() {
    // In production, fetch this.leagueData from a service
  }

  onSubmit() {
    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formData: ISnookerPlayerRegistration = this.registrationForm.value;

    // Simulate backend call
    setTimeout(() => {
      this.isSubmitting = false;
      this.snackBar.open('Registration successful! Welcome to the league.', 'Close', {
        duration: 5000,
        panelClass: ['snackbar-success']
      });
      this.registrationForm.reset({ skillLevel: 'Beginner' });
    }, 2000);
  }
}