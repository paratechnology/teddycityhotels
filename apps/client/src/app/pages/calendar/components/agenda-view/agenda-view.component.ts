import { Component, Input, Output, EventEmitter, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon, IonLabel, IonChip, IonAvatar, IonButton, AlertController, ModalController, PopoverController, IonCardSubtitle, IonPopover, IonList, IonItem } from '@ionic/angular/standalone';
import { ICalendarAppEvent, IFirmUser, IFirmUserSubset } from '@quickprolaw/shared-interfaces';

import { addIcons } from 'ionicons';
import {
  briefcaseOutline, timeOutline, personCircleOutline, calendarClearOutline,
  businessOutline, calendarOutline, bodyOutline, ellipsisVertical,
  locationOutline, createOutline, trashOutline
} from 'ionicons/icons';
import { AuthService } from '../../../../core/services/auth.service';
import { AttendeesPopoverComponent } from '../attendees-popover/attendees-popover.component';

interface EventGroup {
  date: string;
  events: ICalendarAppEvent[];
}

@Component({
  selector: 'app-agenda-view',
  templateUrl: './agenda-view.component.html',
  styleUrls: ['./agenda-view.component.scss'],
  standalone: true,
  imports: [ CommonModule, IonIcon,  IonButton],

})
export class AgendaViewComponent {
  @Input() events: ICalendarAppEvent[] = [];
  @Input() editMode: boolean = false;
  @Output() eventClicked = new EventEmitter<ICalendarAppEvent>();
  @Output() eventDeleted = new EventEmitter<ICalendarAppEvent>();
  @Output() showHistory = new EventEmitter<{ matterId: string, date: string }>();

  public authService = inject(AuthService);
  private popoverCtrl = inject(PopoverController);

  constructor() {
    addIcons({
      briefcaseOutline, timeOutline, personCircleOutline, calendarClearOutline,
      businessOutline, calendarOutline, bodyOutline, ellipsisVertical,
      locationOutline, createOutline, trashOutline
    });
  }

  public groupedEvents = computed<EventGroup[]>(() => {
    if (!this.events) return [];
    const groups: { [key: string]: ICalendarAppEvent[] } = {};

    for (const event of this.events) {
      const eventDate = new Date(event.start).toDateString();
      if (!groups[eventDate]) {
        groups[eventDate] = [];
      }
      groups[eventDate].push(event);
    }

    return Object.keys(groups).map(date => ({
      date,
      events: groups[date]
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  });

  public canManageEvents = computed<boolean>(() => {
    const user = this.authService.userProfile();
    if (!user) return false;
    return user.admin || user.roles.canSchedule;
  });

  getIconForEventType(eventType: string): string {
    switch (eventType) {
      case 'Court Appearance': return 'briefcase-outline';
      case 'Meeting': return 'person-circle-outline';
      case 'Office Event': return 'business-outline';
      case 'Personal': return 'body-outline';
      default: return 'calendar-outline';
    }
  }

  getInitials(fullname: string): string {
    if (!fullname) return '?';
    const names = fullname.split(' ').filter(Boolean);
    return names.length > 1
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : fullname.substring(0, 2).toUpperCase();
  }

  showAttendanceHistory(event: MouseEvent, matterId: string, date: string) {
    event.stopPropagation();
    this.showHistory.emit({ matterId, date });
  }

  onEdit(event: ICalendarAppEvent) {
    this.eventClicked.emit(event);
  }

  onDelete(event: ICalendarAppEvent) {
    this.eventDeleted.emit(event);
  }

  async showAllAttendees(event: ICalendarAppEvent) {
    const popover = await this.popoverCtrl.create({
      component: AttendeesPopoverComponent,
      componentProps: { attendees: event.attendees },
      translucent: true,
      showBackdrop: true,
      cssClass: 'attendees-popover'
    });
    await popover.present();
  }


  isCurrentUser(attendeeId: string): boolean {
    return this.authService.userProfile()?.id === attendeeId;
  }

  sortedAttendees(attendees: IFirmUserSubset[] | undefined): IFirmUserSubset[] {
    if (!attendees) return [];
    return [...attendees].sort((a, b) => {
      const isACurrent = this.isCurrentUser(a.id);
      const isBCurrent = this.isCurrentUser(b.id);
      if (isACurrent && !isBCurrent) return -1;
      if (!isACurrent && isBCurrent) return 1;
      return a.fullname.localeCompare(b.fullname);
    });
  }

  isUserAttending(event: ICalendarAppEvent): boolean {
    if (!event.attendees || event.attendees.length === 0) {
      return false;
    }
    const currentUserId = this.authService.userProfile()?.id;
    if (!currentUserId) {
      return false;
    }
    return event.attendees.some(attendee => attendee.id === currentUserId);
  }

}
