import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonList, IonItem, IonLabel, IonSpinner, IonIcon, IonContent } from '@ionic/angular/standalone';
import { ICalendarAppEvent } from '@quickprolaw/shared-interfaces';
import { CalendarService } from '../../../../core/services/calendar.service';
import { addIcons } from 'ionicons';
import { timeOutline, calendarOutline } from 'ionicons/icons';

@Component({
  selector: 'app-attendance-history-popover',
  templateUrl: './attendance-history-popover.component.html',
  styleUrls: ['./attendance-history-popover.component.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, IonList, IonItem, IonLabel, IonSpinner, IonIcon]
})
export class AttendanceHistoryPopoverComponent implements OnInit {
  @Input() lastEvent: ICalendarAppEvent | null = null;
  @Input() isLoading: boolean = true;
  @Input() matterId!: string;
  @Input() date!: string;

  public calendarService = inject(CalendarService);

  constructor() {
    addIcons({ timeOutline, calendarOutline });
  }

  ngOnInit() {
    this.getLastEvent();
  }

  getLastEvent() {
    this.calendarService.getAttendanceHistory(this.matterId, this.date).subscribe({
      next: (event) => {
        this.lastEvent = event;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.split(' ').filter(Boolean);
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }
}