import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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
import { Subscription } from 'rxjs';
import {
  ICreatePublicSnookerRegistrationDto,
  IProperty,
  ISnookerLeagueData,
} from '@teddy-city-hotels/shared-interfaces';
import { PublicSnookerService } from './snooker.service';
import { PropertyContextService } from '../properties/property-context.service';

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
    MatProgressSpinnerModule,
  ],
  templateUrl: './snooker.component.html',
  styleUrls: ['./snooker.component.scss'],
})
export class SnookerComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private snookerService = inject(PublicSnookerService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private propertyContext = inject(PropertyContextService);

  registrationForm: FormGroup;
  isSubmitting = false;
  isLoadingLeague = false;
  property: IProperty | null = null;
  private propertySubscription?: Subscription;

  leagueData: ISnookerLeagueData = {
    seasonName: '',
    groups: [],
    matches: [],
    competitionStatus: undefined,
    registrationOpen: false,
    registrationFee: 0,
  };

  displayedColumns: string[] = ['position', 'name', 'played', 'won', 'lost', 'points'];

  constructor() {
    this.registrationForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]+$/)]],
      nickname: [''],
      skillLevel: ['Beginner', Validators.required],
    });
  }

  ngOnInit() {
    this.propertySubscription = this.propertyContext.active$.subscribe((property) => {
      this.property = property;
    });
    this.loadLeagueData();
    this.route.queryParamMap.subscribe((params) => {
      const payment = params.get('payment');
      if (!payment) return;

      if (payment === 'success') {
        this.snackBar.open('Registration payment confirmed. Welcome to the competition.', 'Close', {
          duration: 5000,
          panelClass: ['snackbar-success'],
        });
      } else {
        this.snackBar.open('Payment was not completed. You can try the registration again.', 'Close', {
          duration: 5000,
        });
      }

      this.loadLeagueData();
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true,
      });
    });
  }

  ngOnDestroy(): void {
    this.propertySubscription?.unsubscribe();
  }

  loadLeagueData(): void {
    this.isLoadingLeague = true;
    this.snookerService.getLeagueData().subscribe({
      next: (data) => {
        this.leagueData = {
          seasonName: data.seasonName,
          groups: data.groups || [],
          matches: data.matches || [],
          competitionStatus: data.competitionStatus,
          registrationOpen: data.registrationOpen ?? false,
          registrationFee: data.registrationFee || 0,
        };
        this.isLoadingLeague = false;
      },
      error: () => {
        this.isLoadingLeague = false;
        this.snackBar.open('Unable to load snooker competition details right now.', 'Close', {
          duration: 4000,
        });
      },
    });
  }

  onSubmit() {
    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      return;
    }

    if (!this.leagueData.registrationOpen) {
      this.snackBar.open('Registration is currently closed for this competition.', 'Close', {
        duration: 4000,
      });
      return;
    }

    this.isSubmitting = true;
    const formData: ICreatePublicSnookerRegistrationDto = {
      ...this.registrationForm.getRawValue(),
      callbackUrl:
        typeof window !== 'undefined'
          ? `${window.location.origin}/payment-verification`
          : undefined,
    };

    this.snookerService.register(formData).subscribe({
      next: (response) => {
        if (response.paymentData?.authorization_url) {
          window.location.href = response.paymentData.authorization_url;
          return;
        }

        this.isSubmitting = false;
        this.snackBar.open('Registration successful. See you on the tables.', 'Close', {
          duration: 5000,
          panelClass: ['snackbar-success'],
        });
        this.registrationForm.reset({ skillLevel: 'Beginner' });
        this.loadLeagueData();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.snackBar.open(error?.error?.message || 'Registration could not be started.', 'Close', {
          duration: 5000,
        });
      },
    });
  }
}
