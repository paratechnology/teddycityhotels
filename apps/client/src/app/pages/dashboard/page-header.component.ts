import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonButtons, IonTitle, IonIcon, IonButton } from '@ionic/angular/standalone';
import { NavigationService } from '../../core/services/navigation.service';

@Component({
  selector: 'app-page-header',
  template: `
    <ion-header class="ui-header">
      <ion-toolbar class="ui-toolbar">
        <ion-buttons slot="start">
          <ion-button (click)="navigationService.toggleMobileMenu()" color="primary">
            <ion-icon slot="icon-only" name="menu-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
        
        <ion-title class="ui-title">{{ pageTitle }}</ion-title>
        
        <ion-buttons slot="end">
          <ng-content select="[slot=actions-end]"></ng-content>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
  `,
  styles: [`
    /* Header Refinement */
    .ui-header {
      /* Soft shadow instead of border */
      box-shadow: 0 2px 10px rgba(0,0,0,0.03); 
    }

    .ui-toolbar {
      /* Subtle Tint - Not Stark White */
      --background: #f8fafc; 
      --border-width: 0;
      --min-height: 60px; /* Modern height */
      padding-inline: 8px;
    }

    .ui-title {
      font-weight: 700;
      color: var(--ion-color-dark);
      font-size: 1.1rem;
      letter-spacing: -0.01em;
    }

    ion-button {
      --border-radius: 8px;
    }
  `],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonButtons, IonTitle, IonIcon, IonButton]
})
export class PageHeaderComponent {
  @Input() pageTitle = '';
  public navigationService = inject(NavigationService);
}