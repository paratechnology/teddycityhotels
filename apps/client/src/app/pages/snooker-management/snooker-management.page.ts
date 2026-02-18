import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonLabel
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-snooker-management',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonLabel
  ],
  templateUrl: './snooker-management.page.html',
  styleUrls: ['./snooker-management.page.scss']
})
export class SnookerManagementPage {
  // Placeholder data
  public groups = [
    { name: 'Group A', players: ['Player 1', 'Player 2'] },
    { name: 'Group B', players: ['Player 3', 'Player 4'] }
  ];
}
