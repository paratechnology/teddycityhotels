import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
  computed,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  IonButton,
  IonIcon,
  IonFab,
  IonFabButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  ModalController,
  IonSpinner,
  AlertController,
  ToastController,
  IonPopover,
  IonList,
  IonItem,
  IonNote,
  IonToggle,
} from '@ionic/angular/standalone';
import { CalendarModule, CalendarEvent, CalendarView } from 'angular-calendar';
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
  isToday,
  format,
  isSameMonth,
} from 'date-fns'; // <--- Ensure these are imported
import { CalendarService } from '../../core/services/calendar.service';
import { ICalendarAppEvent } from '@teddy-city-hotels/shared-interfaces';
import { addIcons } from 'ionicons';
import {
  add,
  chevronBack,
  chevronForward,
  timeOutline,
  todayOutline,
  ellipsisVertical,
  menuOutline,
  checkboxOutline,
  downloadOutline,
} from 'ionicons/icons';
import { CalendarEventFormComponent } from './components/calendar-event-form/calendar-event-form.component';
import { AgendaViewComponent } from './components/agenda-view/agenda-view.component';
import { AttendanceHistoryPopoverComponent } from './components/attendance-history/attendance-history-popover.component';
import { AuthService } from '../../core/services/auth.service';
import { NavigationService } from '../../core/services/navigation.service';
import { isWithinInterval } from 'date-fns';
import { MasterScheduleComponent } from './components/master-schedule/master-schedule.component';
import { TourService } from '../../core/services/tour.service';
import { DriveStep } from 'driver.js';
import saveAs from 'file-saver';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.page.html',
  styleUrls: ['./calendar.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonMenuButton,
    IonButton,
    IonIcon,
    IonFab,
    IonFabButton,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    CalendarModule,
    IonSpinner,
    IonPopover,
    IonList,
    IonItem,
    IonNote,
    IonToggle,
    AgendaViewComponent,
  ],
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarPage implements OnInit {
  public calendarService = inject(CalendarService);
  private authService = inject(AuthService);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  public navigationService = inject(NavigationService);
  private tourService = inject(TourService);
  private datePipe = inject(DatePipe);
  // Signals for View State
  public view = signal<CalendarView>(CalendarView.Week);
  public viewDate = signal<Date>(new Date());
  public editMode = signal(false);
  public CalendarView = CalendarView;

  public isLoading = computed(
    () => this.calendarService.status() === 'loading'
  );

  public user = this.authService.userProfile;
  public canManageCalendar = computed<boolean>(() => {
    const user = this.authService.userProfile();
    if (!user) return false;
    return user.admin || user.roles.canSchedule;
  });

  public isSending = signal(false);

  // --- NEW: Smart Date Title Logic ---
  public viewTitle = computed(() => {
    const date = this.viewDate();
    const currentView = this.view();

    // 1.Month View -> "February 2026"
    if (currentView === CalendarView.Month) {
      return format(date, 'MMMM yyyy');
    }

    // 2. Week View -> "Feb 9 - 15" or "Jan 28 - Feb 3"
    if (currentView === CalendarView.Week) {
      const start = startOfWeek(date);
      const end = endOfWeek(date);

      // If same month: "Feb 9 - 15"
      if (isSameMonth(start, end)) {
        return `${format(start, 'MMM d')} - ${format(end, 'd')}`;
      }
      // If different months: "Jan 28 - Feb 3"
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
    }

    // 3. Day View -> "Tuesday, Feb 10, 2026"
    return format(date, 'EEEE, MMM d, yyyy');
  });

  public calendarEvents = computed<CalendarEvent[]>(() => {
    return this.calendarService.events().map((event) => ({
      start: new Date(event.start),
      end: event.end ? new Date(event.end) : undefined,
      title: event.title,
      color: this.getEventColor(event.eventType),
      allDay: event.allDay,
      meta: { sourceEvent: event },
      resizable: { beforeStart: true, afterEnd: true },
      draggable: true,
    }));
  });

  public isTodayInView = computed(() => {
    const currentView = this.view();
    const currentDate = this.viewDate();
    const today = new Date();

    if (currentView === CalendarView.Month) {
      return isWithinInterval(today, {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
      });
    }
    return isToday(currentDate);
  });

  constructor() {
    addIcons({
      add,
      chevronBack,
      chevronForward,
      checkboxOutline, 
      timeOutline,
      todayOutline,
      ellipsisVertical,
      menuOutline,
      downloadOutline
    });
  }

  ngOnInit() {
    this.refreshView();
  }

  ionViewDidEnter() {
    setTimeout(() => {
      this.startCalendarTour();
    }, 1500);
  }

  // --- UPDATED: Tour Text to acknowledge Agenda View ---
  private startCalendarTour() {
    const steps: DriveStep[] = [
      {
        popover: {
          title: 'Firm Calendar',
          description:
            'Manage your court dates, meetings, and filing deadlines here.',
        },
      },
      {
        element: '#calendar-add-btn',
        popover: {
          title: 'Add Event',
          description:
            'Click (+) to schedule a new event. You can link it directly to a Case File.',
        },
      },
      {
        element: '#calendar-view-switcher',
        popover: {
          title: 'Switch Views',
          description:
            'You are currently in Agenda View. Switch to Month or Week to see the grid layout.',
        },
      },
      {
        element: '#calendar-date-nav',
        popover: {
          title: 'Navigate',
          description: 'Jump to the next month or week to plan ahead.',
        },
      },
      {
        element: '#calendar-main-grid',
        popover: {
          title: 'Your Schedule',
          description:
            'This list shows all upcoming events grouped by day. Tap any event to edit it.',
        },
      },
    ];
    this.tourService.startTour('calendar_v2', steps);
  }

  private refreshView() {
    const date = this.viewDate();
    this.calendarService.loadEvents(startOfMonth(date), endOfMonth(date));
  }

  onViewChanged(event: any) {
    this.view.set(event.detail.value);
  }

  changeDate(direction: 'prev' | 'next') {
    let newDate = new Date(this.viewDate());
    const currentView = this.view();

    if (currentView === CalendarView.Month) {
      newDate =
        direction === 'next' ? addMonths(newDate, 1) : subMonths(newDate, 1);
    } else if (currentView === CalendarView.Week) {
      newDate =
        direction === 'next' ? addWeeks(newDate, 1) : subWeeks(newDate, 1);
    } else {
      newDate =
        direction === 'next' ? addDays(newDate, 1) : subDays(newDate, 1);
    }

    this.viewDate.set(newDate);
    this.refreshView();
  }

  onDateChange(type: 'today') {
    this.viewDate.set(new Date());
    this.refreshView();
  }

  toggleEditMode(event: any) {
    this.editMode.set(event.detail.checked);
  }

  async openEventForm(event?: ICalendarAppEvent) {
    const modal = await this.modalCtrl.create({
      component: CalendarEventFormComponent,
      componentProps: {
        eventToEdit: event,
        initialDate: this.viewDate(),
      },
    });
    await modal.present();

    const { role } = await modal.onWillDismiss();
    if (role === 'confirm') {
      this.refreshView();
    }
  }

  async handleDeleteEvent(eventId: string) {
    const alert = await this.alertCtrl.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete this event?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.calendarService.deleteEvent(eventId).subscribe({
              next: () => {
                this.presentToast('Event deleted', 'success');
                this.refreshView();
              },
              error: (err) => this.presentToast('Failed to delete', 'danger'),
            });
          },
        },
      ],
    });
    await alert.present();
  }

  async handleShowHistory(data: { matterId: string; date: string }) {
    const modal = await this.modalCtrl.create({
      component: AttendanceHistoryPopoverComponent,
      componentProps: { matterId: data.matterId, date: data.date },
    });
    await modal.present();
  }

  async openMasterScheduleModal(popover?: IonPopover) {
    if (popover) await popover.dismiss();
    const modal = await this.modalCtrl.create({
      component: MasterScheduleComponent,
      cssClass: 'master-schedule-modal',
    });
    await modal.present();
  }

  async sendCalendarNotification() {
    this.isSending.set(true);
    setTimeout(() => {
      this.isSending.set(false);
      this.presentToast('Notifications sent.', 'success');
    }, 1000);
  }

  private async presentToast(
    message: string,
    color: 'success' | 'warning' | 'danger'
  ) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'top',
    });
    await toast.present();
  }

  private getEventColor(type: string) {
    switch (type) {
      case 'Court Appearance':
        return { primary: '#e63946', secondary: '#f8d7da' };
      case 'Meeting':
        return { primary: '#457b9d', secondary: '#d1e7dd' };
      case 'Filing':
        return { primary: '#e9c46a', secondary: '#fff3cd' };
      default:
        return { primary: '#6c757d', secondary: '#e2e3e5' };
    }
  }

  async exportWeeklyDocket() {
    const current = this.viewDate();
    // Calculate start/end of the week based on the current view date
    const start = startOfWeek(current, { weekStartsOn: 1 }); // Monday start
    const end = endOfWeek(current, { weekStartsOn: 1 });

    // Filter events for this specific week range
    const events = this.calendarService.events().filter((e) => {
      const eDate = new Date(e.start);
      return eDate >= start && eDate <= end;
    });

    if (events.length === 0) {
      this.presentToast('No events found for this week to export.', 'warning');
      return;
    }

    this.presentToast('Generating Weekly Docket...', 'success');

    const rangeStr = `${this.datePipe.transform(
      start,
      'mediumDate'
    )} - ${this.datePipe.transform(end, 'mediumDate')}`;

    const payload = {
      events: events,
      weekRange: rangeStr,
    };

    this.calendarService.downloadWeeklyDocket(payload).subscribe({
      next: (blob: Blob) => {
        const fileName = `Weekly_Docket_${this.datePipe.transform(
          start,
          'yyyy-MM-dd'
        )}.pdf`;
        saveAs(blob, fileName);
      },
      error: (err) => {
        console.error(err);
        this.presentToast('Failed to export docket.', 'danger');
      },
    });
  }
}
