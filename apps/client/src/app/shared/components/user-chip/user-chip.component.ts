import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonChip, IonAvatar, IonLabel } from '@ionic/angular/standalone';
import { IFirmUserSubset } from '@teddy-city-hotels/shared-interfaces';

@Component({
  selector: 'app-user-chip',
  standalone: true,
  imports: [CommonModule, IonChip, IonAvatar, IonLabel],
  template: `
    <ion-chip *ngIf="user">
      <ion-avatar>
        <div class="avatar-initials">{{ getInitials(user.fullname) }}</div>
      </ion-avatar>
      <ion-label>{{ user.fullname }}</ion-label>
    </ion-chip>
  `,
  styles: [`
    ion-avatar {
      width: 24px;
      height: 24px;
    }
    .avatar-initials {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background-color: var(--ion-color-primary);
      color: var(--ion-color-primary-contrast);
      font-size: 0.8em;
      font-weight: bold;
    }
  `]
})
export class UserChipComponent {
  @Input() user!: IFirmUserSubset;

  getInitials(fullname: string): string {
    if (!fullname) return '';
    const names = fullname.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return fullname.substring(0, 2).toUpperCase();
  }
}
