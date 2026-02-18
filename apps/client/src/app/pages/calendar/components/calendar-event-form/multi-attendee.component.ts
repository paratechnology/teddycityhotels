import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonCheckbox,
  IonLabel,
  IonSearchbar,
  ModalController
} from '@ionic/angular/standalone';
import { IFirmUser } from '@quickprolaw/shared-interfaces';

@Component({
  selector: 'app-multi-attendee-select',
  standalone: true,
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Select Attendees</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="confirm()">Done</ion-button>
        </ion-buttons>
        <ion-buttons slot="start">
          <ion-button color="medium" (click)="cancel()">Cancel</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-searchbar [(ngModel)]="searchTerm" placeholder="Search..." debounce="200"></ion-searchbar>
      <ion-list>
        <ion-item *ngFor="let user of filteredUsers()">
          <ion-checkbox
            slot="start"
            [(ngModel)]="selectionMap[user.id]"
            [checked]="selectionMap[user.id]">
          </ion-checkbox>
          <ion-label>{{ user.fullname }}</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonList, IonItem, IonCheckbox, IonLabel, IonSearchbar
  ]
})
export class MultiAttendeeSelectComponent {
  @Input() users: IFirmUser[] = [];
  @Input() initiallySelected: string[] = [];

  searchTerm = '';
  selectionMap: Record<string, boolean> = {};

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    // Initialize map of selected users
    for (const user of this.users) {
      this.selectionMap[user.id] = this.initiallySelected.includes(user.id);
    }
  }

  filteredUsers() {
    const term = this.searchTerm.toLowerCase();
    return this.users.filter(u => u.fullname.toLowerCase().includes(term));
  }

  confirm() {
    const selected = this.users.filter(u => this.selectionMap[u.id]);
    this.modalCtrl.dismiss(selected, 'confirm');
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
