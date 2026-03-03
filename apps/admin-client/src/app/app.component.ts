import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { HeaderComponent } from './layout/header.component';
import { SidebarComponent } from './layout/sidebar.component';
import { MainContentComponent } from './layout/main-content.component';
import { AdminSessionService } from './core/admin-session.service';
import { filter } from 'rxjs';
import { LayoutStateService } from './core/layout-state.service';
import { InAppAlertsComponent } from './components/in-app-alerts/in-app-alerts.component';
import { AdminRealtimeService } from './core/admin-realtime.service';
import { PwaService } from './core/pwa.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    SidebarComponent,
    MainContentComponent,
    InAppAlertsComponent,
  ],
  template: `
    <ng-container *ngIf="showShell; else authPage">
      <app-header></app-header>
      <div class="main-container" [class.sidebar-collapsed]="layout.effectiveCollapsed">
        <app-sidebar></app-sidebar>
        <app-main-content></app-main-content>
      </div>
      <app-in-app-alerts></app-in-app-alerts>
    </ng-container>

    <ng-template #authPage>
      <router-outlet></router-outlet>
    </ng-template>
  `,
  styles: [
    `
      :host {
        min-height: 100vh;
        display: block;
      }

      .main-container {
        display: grid;
        grid-template-columns: 250px 1fr;
        min-height: calc(100vh - 64px);
        align-items: stretch;
        transition: grid-template-columns 0.2s ease;
      }

      .main-container.sidebar-collapsed {
        grid-template-columns: 84px 1fr;
      }

      @media (max-width: 900px) {
        .main-container {
          grid-template-columns: 1fr;
          min-height: calc(100vh - 74px);
        }
      }
    `,
  ],
})
export class AppComponent implements OnInit {
  showShell = true;

  constructor(
    private session: AdminSessionService,
    public layout: LayoutStateService,
    private realtime: AdminRealtimeService,
    private pwa: PwaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.pwa.init();

    this.updateShell(this.router.url);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.updateShell(event.urlAfterRedirects));

    if (this.session.token) {
      this.session.refreshProfile().subscribe({
        next: () => {
          this.realtime.start();
        },
        error: () => {
          this.session.clearSession();
          this.realtime.stop();
          this.router.navigate(['/login']);
        },
      });
    }
  }

  private updateShell(url: string): void {
    this.showShell = !url.startsWith('/login');

    if (!this.showShell) {
      this.realtime.stop();
      return;
    }

    if (this.session.token) {
      this.realtime.start();
    }
  }
}
