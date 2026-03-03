import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IHotelDashboardStats } from '@teddy-city-hotels/shared-interfaces';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  stats: IHotelDashboardStats | null = null;
  loading = false;
  error = '';

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.dashboardService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.loading = false;
      },
      error: (error) => {
        this.error = error?.error?.message || 'Failed to load dashboard metrics.';
        this.loading = false;
      },
    });
  }
}

