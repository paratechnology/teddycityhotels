import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonList, IonListHeader, IonItem, IonAvatar, IonLabel, IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-attendees-popover',
  templateUrl: './attendees-popover.component.html',
  styleUrls: ['./attendees-popover.component.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, IonList, IonItem, IonLabel]
})
export class AttendeesPopoverComponent {
  @Input() attendees: { id: string; fullname: string }[] = [];

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.split(' ').filter(Boolean);
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }
}
