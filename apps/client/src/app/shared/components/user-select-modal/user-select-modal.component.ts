import { Component, OnInit, inject, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonSearchbar, IonList, IonItem, IonAvatar, IonLabel, ModalController } from '@ionic/angular/standalone';
import { IFirmUser } from '@teddy-city-hotels/shared-interfaces';
import { FirmService } from '../../../core/services/firm.service';

@Component({
  selector: 'app-user-select-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ title }}</ion-title>
        <ion-buttons slot="start">
          <ion-button (click)="cancel()">Cancel</ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar placeholder="Search for a user..." (ionInput)="onSearch($event)"></ion-searchbar>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        @for (user of filteredUsers(); track user.id) {
          <ion-item button (click)="selectUser(user)">
            <ion-avatar slot="start">
              <img [src]="user.picture" *ngIf="user.picture" />
              <div class="initials-fallback" *ngIf="!user.picture">{{ getInitials(user.fullname) }}</div>
            </ion-avatar>
            <ion-label>{{ user.fullname }}</ion-label>
          </ion-item>
        }
      </ion-list>
    </ion-content>
  `,
  styles: [`.initials-fallback { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background-color: var(--ion-color-light); color: var(--ion-color-primary); font-weight: 500; }`],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonSearchbar, IonList, IonItem, IonAvatar, IonLabel]
})
export class UserSelectModalComponent implements OnInit {
  @Input() title = 'Select User';
  private firmService = inject(FirmService);
  private modalCtrl = inject(ModalController);

  private allUsers = signal<IFirmUser[]>([]);
  public filteredUsers = signal<IFirmUser[]>([]);

  ngOnInit() {
    this.firmService.getUsers().subscribe(users => {
      this.allUsers.set(users);
      this.filteredUsers.set(users);
    });
  }

  onSearch(event: any) {
    const query = event.target.value.toLowerCase();
    this.filteredUsers.set(this.allUsers().filter(u => u.fullname.toLowerCase().includes(query)));
  }

  getInitials(fullname: string): string {
    return fullname.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  cancel() { this.modalCtrl.dismiss(null, 'cancel'); }
  selectUser(user: IFirmUser) { this.modalCtrl.dismiss(user, 'confirm'); }
}
