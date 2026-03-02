import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { HeaderComponent } from './layout/header.component';
import { SidebarComponent } from './layout/sidebar.component';
import { MainContentComponent } from './layout/main-content.component';
import { AdminSessionService } from './core/admin-session.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, SidebarComponent, MainContentComponent],
  template: `
    <ng-container *ngIf="showShell; else authPage">
      <app-header></app-header>
      <div class="main-container">
        <app-sidebar></app-sidebar>
        <app-main-content></app-main-content>
      </div>
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
        grid-template-columns: 240px 1fr;
        min-height: calc(100vh - 64px);
        align-items: stretch;
      }

      @media (max-width: 900px) {
        .main-container {
          grid-template-columns: 1fr;
          min-height: calc(100vh - 64px);
        }
      }
    `,
  ],
})
export class AppComponent implements OnInit {
  showShell = true;

  constructor(private session: AdminSessionService, private router: Router) {}

  ngOnInit(): void {
    this.updateShell(this.router.url);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.updateShell(event.urlAfterRedirects));

    if (this.session.token) {
      this.session.refreshProfile().subscribe({
        error: () => {
          // Keep routing accessible; guards will enforce module-level restrictions.
        },
      });
    }
  }

  private updateShell(url: string): void {
    this.showShell = !url.startsWith('/login');
  }
}
