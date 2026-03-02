import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IHotelDashboardStats } from '@teddy-city-hotels/shared-interfaces';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page">
      <h2>Dashboard</h2>

      <p *ngIf="loading">Loading dashboard...</p>
      <p class="error" *ngIf="error">{{ error }}</p>

      <div class="cards" *ngIf="!loading && stats">
        <article>
          <h3>Occupancy</h3>
          <p>{{ stats.occupancyRate }}%</p>
          <small>{{ stats.occupiedRooms }} occupied / {{ stats.totalRooms }} total</small>
        </article>
        <article>
          <h3>Active Bookings</h3>
          <p>{{ stats.activeBookings }}</p>
          <small>{{ stats.pendingBookings }} pending</small>
        </article>
        <article>
          <h3>Today Revenue</h3>
          <p>{{ stats.todayRevenue | currency : 'NGN' }}</p>
          <small>This month: {{ stats.monthRevenue | currency : 'NGN' }}</small>
        </article>
        <article>
          <h3>Pending Alerts</h3>
          <p>{{ stats.pendingNotifications }}</p>
          <small>Unread notifications</small>
        </article>
      </div>
    </section>
  `,
  styles: [
    `
      .page {
        display: grid;
        gap: 1rem;
      }

      .cards {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }

      article {
        border: 1px solid #d9e1e8;
        border-radius: 12px;
        padding: 1rem;
        background: #fff;
      }

      h3 {
        margin: 0 0 0.5rem;
        font-size: 0.95rem;
      }

      p {
        font-size: 1.45rem;
        font-weight: 700;
        margin: 0 0 0.4rem;
      }

      .error {
        color: #b91c1c;
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  stats: IHotelDashboardStats | null = null;
  loading = false;
  error = '';

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loading = true;
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
