import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonLabel
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-swimming-management',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonLabel
  ],
  templateUrl: './swimming-management.page.html',
  styleUrls: ['./swimming-management.page.scss']
})
export class SwimmingManagementPage {
  // Placeholder data
  public lessons = [
    { time: '10:00 AM', student: 'John Doe', type: 'Private' },
    { time: '2:00 PM', student: 'Jane Smith', type: 'Group' }
  ];
}
