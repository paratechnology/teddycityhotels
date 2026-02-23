import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './layout/header.component';
import { SidebarComponent } from './layout/sidebar.component';
import { MainContentComponent } from './layout/main-content.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, HeaderComponent, SidebarComponent, MainContentComponent],
  template: `
    <app-header></app-header>
    <div class="main-container">
      <app-sidebar></app-sidebar>
      <app-main-content></app-main-content>
    </div>
  `,
  styles: [`
    .main-container {
      display: flex;
    }
  `]
})
export class AppComponent {
}
