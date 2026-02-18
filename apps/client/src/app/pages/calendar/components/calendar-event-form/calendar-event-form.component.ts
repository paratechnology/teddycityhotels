import { Component, Input, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonInput, IonSelect, IonSelectOption, IonSpinner, IonLabel, IonNote, IonIcon, IonTextarea, IonToggle, IonDatetime, IonDatetimeButton, IonModal, ToastController, IonItemGroup, IonItemDivider, IonText, IonListHeader, IonFooter, IonPopover } from '@ionic/angular/standalone';
import { ICalendarAppEvent, IMatter, IClient, IFirmUserSubset, CalendarEventType, ILitigationMatter, IRealEstateMatter } from '@quickprolaw/shared-interfaces';
import { CalendarService } from '../../../../core/services/calendar.service';
import { MatterService } from '../../../../core/services/matter.service';
import { FirmService } from '../../../../core/services/firm.service';
import { SearchableSelectComponent } from '../../../../components/searchable-select/searchable-select.component';
import { firstValueFrom, Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import { 
  chevronForward, closeCircle, listOutline, briefcaseOutline, textOutline, 
  personOutline, locationOutline, flagOutline, calendarOutline, timeOutline, 
  add, documentTextOutline, addCircle, chevronDown,
  informationCircleOutline 
} from 'ionicons/icons';
import { ClientService } from '../../../../core/services/client.service';
import { MultiAttendeeSelectComponent } from './multi-attendee.component';
import { UserChipComponent } from '../../../../shared/components/user-chip/user-chip.component';

@Component({
  selector: 'app-calendar-event-form',
  templateUrl: './calendar-event-form.component.html',
  styleUrls: ['./calendar-event-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonButtons, 
    IonButton, IonContent, IonItem, IonInput, IonSelect, IonSelectOption, 
    IonSpinner, IonLabel, IonIcon, IonTextarea, IonPopover, UserChipComponent,
    IonToggle
  ]
})
export class CalendarEventFormComponent implements OnInit, OnDestroy {
  @Input() event?: ICalendarAppEvent;
  // FIX: Accept Date or string to prevent crashes
  @Input() initialDate?: string | Date; 

  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private calendarService = inject(CalendarService);
  private matterService = inject(MatterService);
  private clientService = inject(ClientService);
  private firmService = inject(FirmService);

  public form!: FormGroup;
  public isEditMode = false;
  public isSubmitting = false;
  public eventTypes: CalendarEventType[] = ['Court Appearance', 'Meeting', 'Office Event', 'Personal'];

  public selectedMatter = signal<IMatter | null>(null);
  public selectedClient = signal<IClient | null>(null);
  public selectedAttendees = signal<IFirmUserSubset[]>([]);

  private destroy$ = new Subject<void>();

  constructor() {
    addIcons({ 
      chevronForward, closeCircle, addCircle, listOutline, briefcaseOutline, 
      textOutline, personOutline, locationOutline, flagOutline, calendarOutline, 
      timeOutline, add, documentTextOutline, informationCircleOutline , chevronDown
    });
  }

  ngOnInit() {
    this.isEditMode = !!this.event;
    this.initializeForm();
    this.setupFormListeners();

    console.log(this.isEditMode, this.event);
    if (this.isEditMode && this.event) {
      this.form.patchValue({
        eventType: this.event.eventType,
        title: this.event.title,
        allDay: this.event.allDay,
        location: this.event.location,
        description: this.event.description,
        position: this.event.position
      });
      
      console.log('Event on init:', this.event);
      if (this.event.matter) {
        this.matterService.getMatterById(this.event.matter.id).subscribe(matter => this.selectedMatter.set(matter));
      }
      this.selectedAttendees.set(this.event.attendees || []);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm() {
    // FIX: Safely convert input to ISO string regardless of type
    let fullDateString = new Date().toISOString();

    if (this.event?.start) {
      fullDateString = this.ensureIsoString(this.event.start);
    } else if (this.initialDate) {
      fullDateString = this.ensureIsoString(this.initialDate);
    }
    
    // Now splitting is safe
    const datePart = fullDateString.split('T')[0];
    const timePart = fullDateString.split('T')[1]?.substring(0, 5) || '09:00';

    this.form = this.fb.group({
      eventType: [this.event?.eventType || 'Office Event', Validators.required],
      title: [this.event?.title || '', Validators.required],
      startDate: [datePart, Validators.required], 
      startTime: [timePart, Validators.required], 
      allDay: [this.event?.allDay || false],
      location: [this.event?.location || 'Office'],
      description: [this.event?.description || ''],
      position: [this.event?.position || null]
    });
  }

  // Helper to handle Date | string
  private ensureIsoString(val: string | Date): string {
    if (val instanceof Date) return val.toISOString();
    return val;
  }

  private setupFormListeners() {
    this.form.get('eventType')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(type => {
      this.onEventTypeChange(type);
    });
  }

  private onEventTypeChange(type: CalendarEventType) {
    const titleCtrl = this.form.get('title');
    const locationCtrl = this.form.get('location');
    
    titleCtrl?.enable();
    locationCtrl?.enable();
    this.selectedMatter.set(null);
    this.selectedClient.set(null);

    switch (type) {
      case 'Court Appearance':
        this.setDefaultTime('09:00');
        break;
      case 'Office Event':
        titleCtrl?.setValue('Office Duty');
        titleCtrl?.disable();
        locationCtrl?.setValue('Office');
        locationCtrl?.disable();
        this.setDefaultTime('08:00');
        break;
      case 'Meeting':
      case 'Personal':
        titleCtrl?.setValue('');
        locationCtrl?.setValue('');
        break;
    }
  }

  private setDefaultTime(time: string) {
    this.form.patchValue({ startTime: time });
  }

  async openMatterSelect() {
    const matters = await firstValueFrom(this.matterService.getMattersForSelection());
    const modal = await this.modalCtrl.create({ component: SearchableSelectComponent, componentProps: { items: matters, title: 'Select Matter', displayKey: 'title' } });
    await modal.present();
    const { data, role } = await modal.onWillDismiss();
    
    if (role === 'confirm' && data) {
      this.selectedMatter.set(data);
      let suggestedLocation = '';
      if (data.matterType === 'litigation') {
        suggestedLocation = (data as ILitigationMatter).location || '';
      } else if (data.matterType === 'real_estate') {
        suggestedLocation = (data as IRealEstateMatter).propertyAddress || '';
      }
      this.form.patchValue({ title: data.title, location: suggestedLocation });
    }
  }

  async openClientSelect() {
    const clients = await firstValueFrom(this.clientService.loadClients({ page: 1, pageSize: 1000 }));
    const modal = await this.modalCtrl.create({ component: SearchableSelectComponent, componentProps: { items: clients.data, title: 'Select Client', displayKey: 'fullname' } });
    await modal.present();
    const { data, role } = await modal.onWillDismiss();
    if (role === 'confirm' && data) this.selectedClient.set(data);
  }

  async openAttendeeSelect() {
    const eventType = this.form.get('eventType')?.value;
    let availableUsers: IFirmUserSubset[] = [];
    const allUsers = await firstValueFrom(this.firmService.getUsers());

    if (eventType === 'Office Event') {
      const eventDate = this.form.get('startDate')?.value;
      try {
        const busyUsers = await firstValueFrom(this.calendarService.getUsersInCourtOnDate(eventDate));
        const busyUserIds = new Set(busyUsers.map(u => u.id));
        availableUsers = allUsers.filter(u => !busyUserIds.has(u.id));
      } catch (error) {
        availableUsers = allUsers;
      }
    } else {
      availableUsers = allUsers;
    }

    const modal = await this.modalCtrl.create({
      component: MultiAttendeeSelectComponent,
      componentProps: {
        users: availableUsers,
        initiallySelected: this.selectedAttendees().map(u => u.id)
      }
    });

    await modal.present();
    const { data, role } = await modal.onWillDismiss<IFirmUserSubset[]>(); 
    
    if (role === 'confirm' && data) {
      this.selectedAttendees.set(data);
    }
  }

  removeAttendee(attendeeId: string) {
    this.selectedAttendees.update(current => current.filter(u => u.id !== attendeeId));
  }

  cancel() { this.modalCtrl.dismiss(null, 'cancel'); }

  async save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSubmitting = true;
    
    const { startDate, startTime, ...rest } = this.form.getRawValue();
    const startISO = `${startDate.split('T')[0]}T${startTime}:00`;

    const eventData = {
      ...rest,
      start: startISO,
      matter: this.selectedMatter() ? { id: this.selectedMatter()!.id, title: this.selectedMatter()!.title, judge: (this.selectedMatter() as ILitigationMatter)?.judge} : undefined,
      client: this.selectedClient() ? { id: this.selectedClient()!.id, name: this.selectedClient()!.fullname } : undefined,
      attendees: this.selectedAttendees(),
    };

    const action$ = this.isEditMode ? this.calendarService.updateEvent(this.event!.id, eventData) : this.calendarService.createEvent(eventData);
    
    action$.pipe(finalize(() => this.isSubmitting = false)).subscribe({
      next: async (result) => {
        const toast = await this.toastCtrl.create({ message: `Event ${this.isEditMode ? 'updated' : 'created'}.`, duration: 2000, color: 'success' });
        toast.present();
        this.modalCtrl.dismiss(result, 'confirm');
      },
      error: async (err) => {
        const toast = await this.toastCtrl.create({ message: err.error?.message || 'An error occurred.', duration: 3000, color: 'danger' });
        toast.present();
      }
    });
  }
}