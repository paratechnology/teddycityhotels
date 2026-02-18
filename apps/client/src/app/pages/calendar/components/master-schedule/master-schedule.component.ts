import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  IonToggle,
  ModalController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonSearchbar,
  IonFooter,
  IonSpinner,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  close,
  chevronBack,
  chevronForward,
  add,
  saveOutline,
  sendOutline,
  createOutline,
  downloadOutline,
  calendarOutline,
} from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { finalize } from 'rxjs';
import { CalendarEventFormComponent } from '../calendar-event-form/calendar-event-form.component';

// Services
import { CalendarService } from '../../../../core/services/calendar.service';
import { UserService } from '../../../../core/services/user.service';
import { FirmService } from '../../../../core/services/firm.service';
import {
  ICalendarAppEvent,
  IFirmUser,
  CreateCalendarEventDto,
  UpdateCalendarEventDto,
  IFirmUserSubset,
} from '@quickprolaw/shared-interfaces';

import { TourService } from '../../../../core/services/tour.service';
import { DriveStep } from 'driver.js';


@Component({
  selector: 'app-master-schedule',
  templateUrl: './master-schedule.component.html',
  styleUrls: ['./master-schedule.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonToggle,
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonSearchbar,
    IonFooter,
    IonSpinner,
  ],
})
export class MasterScheduleComponent implements OnInit {
  private modalCtrl = inject(ModalController);
  private calendarService = inject(CalendarService);
  private userService = inject(UserService);
  private firmService = inject(FirmService);
  private toastCtrl = inject(ToastController);
  private tourService = inject(TourService);
  // --- Date & Grid ---
  public currentWeekStartDate = signal(new Date());
  public weekDays = signal<Date[]>([]);
  public timeSlots = signal<string[]>([]); // e.g., "09:00", "10:00"

  // --- Data Signals ---
  public staff = signal<IFirmUser[]>([]);
  public departments = signal<string[]>([]);
  public existingEvents = this.calendarService.events; 
  public draftEvents = signal<Partial<CreateCalendarEventDto>[]>([]);
  public isSaving = signal(false);
  public staffSearchTerm = signal('');
  public showWeekends = signal(false);

  // --- Selection & Highlighting ---
  public selectedStaffForFilter = signal<IFirmUser | null>(null);
  public selectedEventForHighlight = signal<ICalendarAppEvent | Partial<CreateCalendarEventDto> | null>(null);
  public lastEventAttendees = signal<IFirmUserSubset[]>([]);
  public currentDate = signal(new Date());

  // --- Computed ---
  public filteredStaff = computed(() => {
    const term = this.staffSearchTerm().toLowerCase();
    if (!term) return this.staff();
    return this.staff().filter((u) => u.fullname.toLowerCase().includes(term));
  });

  public dailyEvents = computed(() => {
    const draftIds = new Set(this.draftEvents().map((d) => d.id));
    // Filter out existing events if a draft version exists (optimistic UI)
    const visibleExisting = this.existingEvents().filter((e) => !draftIds.has(e.id));
    const allEvents = [...visibleExisting, ...this.draftEvents()];
    
    const current = this.currentDate();
    // Filter by the currently selected day
    return allEvents.filter((e) => new Date(e.start!).toDateString() === current.toDateString());
  });

  constructor() {
    addIcons({
      close,
      chevronBack,
      chevronForward,
      add,
      saveOutline,
      sendOutline,
      createOutline,
      downloadOutline,
      calendarOutline,
    });
  }

  ngOnInit() {
    this.userService.getFirmUsers().subscribe((users) => this.staff.set(users));
    this.firmService.getProfile().subscribe((firm) => this.departments.set(firm.departments || []));
    
    this.generateTimeSlots();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.setWeek(today);
    this.selectDay(today);
  // === ADD THIS BLOCK ===
    // Trigger Tour after view initializes
    setTimeout(() => {
      this.startMasterScheduleTour();
    }, 1000);
    // ======================
  }

  // === ADD THIS METHOD ===
  private startMasterScheduleTour() {
    const steps: DriveStep[] = [
      {
        popover: {
          title: 'Master Schedule',
          description: 'This is your firm’s command center. Manage everyone’s time from a single view.'
        }
      },
      {
        element: '#ms-sidebar', // Ensure you add this ID to your sidebar HTML div
        popover: {
          title: 'Staff Filter',
          description: 'Select a staff member to see only their schedule, or view everyone at once.'
        }
      },
      {
        element: '#ms-grid', // Ensure you add this ID to your main-schedule HTML div
        popover: {
          title: 'Draft Mode',
          description: 'Click empty slots to create "Draft" events. They are visible only to you until saved.'
        }
      },
      {
        element: '#ms-footer', // Ensure you add this ID to your footer HTML
        popover: {
          title: 'Bulk Save',
          description: 'Commit all your drafts at once and notify attendees with a single click.'
        }
      }
    ];

    this.tourService.startTour('master_schedule_v1', steps);
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  private setWeek(date: Date) {
    const weekStart = this.getStartOfWeek(date);
    this.currentWeekStartDate.set(weekStart);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(weekStart);
      nextDay.setDate(weekStart.getDate() + i);
      days.push(nextDay);
    }
    this.weekDays.set(days);
  }

  selectDay(day: Date) {
    this.currentDate.set(day);
    day.setHours(0, 0, 0, 0);
    this.clearFilters();
    // Fetch events for this specific day to ensure grid is fresh
    this.calendarService.loadEvents(day, day);
  }

  // --- Helper Methods ---
  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    return new Date(d.setDate(diff));
  }

  private generateTimeSlots() {
    const slots: string[] = [];
    for (let i = 8; i <= 17; i++) {
      slots.push(`${i.toString().padStart(2, '0')}:00`);
    }
    this.timeSlots.set(slots);
  }

  changeWeek(direction: number) {
    const newDate = new Date(this.currentWeekStartDate());
    newDate.setDate(newDate.getDate() + 7 * direction);
    this.setWeek(newDate);
    this.selectDay(newDate); // Auto-select start of new week
  }

  handleSearch(event: any) {
    this.staffSearchTerm.set(event.detail.value || '');
  }

  toggleWeekends(event: any) {
    this.showWeekends.set(event.detail.checked);
  }

  // --- Interaction Logic ---

  toggleStaffFilter(user: IFirmUser) {
    this.selectedEventForHighlight.set(null);
    if (this.selectedStaffForFilter()?.id === user.id) {
      this.selectedStaffForFilter.set(null);
    } else {
      this.selectedStaffForFilter.set(user);
    }
  }

  toggleEventHighlight(event: ICalendarAppEvent | Partial<CreateCalendarEventDto>) {
    this.selectedStaffForFilter.set(null);
    if (this.selectedEventForHighlight() === event) {
      this.selectedEventForHighlight.set(null);
    } else {
      this.selectedEventForHighlight.set(event);
      this.loadAttendanceHistory(event);
    }
  }

  async loadAttendanceHistory(event: ICalendarAppEvent | Partial<CreateCalendarEventDto>) {
    if ('matter' in event && event.matter?.id) {
      const beforeDate = event.start!;
      try {
        const lastEvent = await firstValueFrom(
          this.calendarService.getAttendanceHistory(event.matter.id, beforeDate)
        );
        this.lastEventAttendees.set(lastEvent?.attendees || []);
      } catch (error) {
        console.error('Error loading attendance history:', error);
      }
    }
  }

  public didUserAttendLastEvent(user: IFirmUser): boolean {
    return this.lastEventAttendees().some((attendee) => attendee.id === user.id);
  }

  clearFilters() {
    this.selectedStaffForFilter.set(null);
    this.selectedEventForHighlight.set(null);
  }

  handleStaffClick(user: IFirmUser) {
    const selectedEvent = this.selectedEventForHighlight();
    if (selectedEvent) {
      this.toggleAttendee(user, selectedEvent);
    } else {
      this.toggleStaffFilter(user);
    }
  }

  private toggleAttendee(user: IFirmUser, event: ICalendarAppEvent | Partial<CreateCalendarEventDto>) {
    const eventId = 'id' in event ? event.id : undefined;
    
    // FIX: Typed as Partial<CreateCalendarEventDto> to avoid strict property checks against ICalendarAppEvent
    let draftToUpdate: Partial<CreateCalendarEventDto> | undefined = this.draftEvents().find((d) => d.id === eventId);

    if (!draftToUpdate) {
      // Cast to any/Partial to allow the spread of properties that might be null (like endorsementId)
      draftToUpdate = { ...event } as Partial<CreateCalendarEventDto>;
    }

    draftToUpdate.attendees = [...(draftToUpdate.attendees || [])];
    const attendeeIndex = draftToUpdate.attendees!.findIndex((a) => a.id === user.id);

    if (attendeeIndex > -1) {
      draftToUpdate.attendees!.splice(attendeeIndex, 1);
    } else {
      draftToUpdate.attendees!.push({ id: user.id, fullname: user.fullname });
    }

    const existingDraftIndex = this.draftEvents().findIndex((d) => d.id === draftToUpdate!.id);
    if (existingDraftIndex > -1) {
      this.draftEvents.update((drafts) => {
        drafts[existingDraftIndex] = draftToUpdate!;
        return [...drafts];
      });
    } else {
      this.draftEvents.update((drafts) => [...drafts, draftToUpdate!]);
      if (eventId) {
        this.selectedEventForHighlight.set(draftToUpdate);
      }
    }
  }

  isUserAttendee(event: ICalendarAppEvent | Partial<CreateCalendarEventDto> | null, user: IFirmUserSubset): boolean {
    if (!event?.attendees) return false;
    return event.attendees.some((a) => a.id === user.id);
  }

  isUserDimmed(event: ICalendarAppEvent | Partial<CreateCalendarEventDto> | null, user: IFirmUser): boolean {
    return !!event && !this.isUserAttendee(event, user);
  }

  isEventDimmed(event: ICalendarAppEvent | Partial<CreateCalendarEventDto>): boolean {
    const selectedStaff = this.selectedStaffForFilter();
    if (!selectedStaff) return false;
    return !this.isUserAttendee(event, selectedStaff);
  }

  isDraftEvent(event: any): boolean {
    return !('id' in event && event.id);
  }

  getEventsForSlot(time: string): (ICalendarAppEvent | Partial<ICalendarAppEvent>)[] {
    const [hour] = time.split(':');
    const slotTime = new Date(this.currentDate());
    slotTime.setHours(parseInt(hour, 10), 0, 0, 0);
    const nextHour = new Date(slotTime);
    nextHour.setHours(slotTime.getHours() + 1);

    return this.dailyEvents().filter((e) => {
      const eStart = new Date(e.start!);
      return eStart >= slotTime && eStart < nextHour;
    });
  }

  getInitials(name: string | undefined): string {
    if (!name) return '?';
    const parts = name.split(' ').filter(Boolean);
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }

  // --- CRUD Operations ---

  async addDraftEvent(day: Date, time: string, ev?: MouseEvent | { day: Date; time: string }) {
    const [hour, minute] = time.split(':');
    const startDate = new Date(day);
    startDate.setHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);

    this.clearFilters();

    const modal = await this.modalCtrl.create({
      component: CalendarEventFormComponent,
      componentProps: { initialDate: startDate.toISOString() },
    });
    await modal.present();

    const { role } = await modal.onWillDismiss();
    if (role === 'confirm') {
      // FIX: Refresh real data from backend
      this.selectDay(this.currentDate());
    }
  }

  async editEvent(eventToEdit: ICalendarAppEvent | Partial<CreateCalendarEventDto>, ev?: MouseEvent) {
    if (ev) ev.stopPropagation();

    const modal = await this.modalCtrl.create({
      component: CalendarEventFormComponent,
      componentProps: { event: eventToEdit as ICalendarAppEvent },
    });
    await modal.present();

    const { role } = await modal.onWillDismiss();
    if (role === 'confirm') {
      // FIX: Refresh real data from backend
      this.selectDay(this.currentDate());
      // Clear drafts because the backend now has the authoritative version
      this.draftEvents.set([]);
      this.clearFilters();
    }
  }

  async saveAll() {
    this.isSaving.set(true);
    const draftList = this.draftEvents();

    if (draftList.length === 0) {
      this.presentToast('No draft events to save.', 'warning');
      this.isSaving.set(false);
      return;
    }

    const payload = {
      eventsToCreate: draftList.filter((d) => !('id' in d && d.id)) as CreateCalendarEventDto[],
      eventsToUpdate: draftList.filter((d) => 'id' in d && d.id) as UpdateCalendarEventDto[],
    };

    this.calendarService
      .bulkUpsertEvents(payload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.presentToast(`Successfully saved ${draftList.length} events.`, 'success');
          this.draftEvents.set([]);
          this.selectDay(this.currentDate()); // Refresh data
          this.modalCtrl.dismiss('confirm');
        },
        error: (err) => {
          const message = err.error?.message || 'Failed to save events. Please try again.';
          this.presentToast(message, 'danger');
        },
      });
  }

  private async presentToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'top',
    });
    await toast.present();
  }
}