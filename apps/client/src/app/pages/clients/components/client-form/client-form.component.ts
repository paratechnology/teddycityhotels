import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, 
  IonItem, IonInput, IonSelect, IonSelectOption, IonSpinner, ToastController, 
  ModalController, IonIcon, IonFooter, IonSegment, IonSegmentButton, IonLabel,
  IonTextarea 
} from '@ionic/angular/standalone';
import { IClient, CreateClientDto, UpdateClientDto, ClientType } from '@quickprolaw/shared-interfaces';
import { finalize } from 'rxjs';
import { ClientService } from '../../../../core/services/client.service';
import { addIcons } from 'ionicons';
import { 
  personOutline, mailOutline, callOutline, locationOutline, 
  briefcaseOutline, personCircleOutline, documentTextOutline, 
  flagOutline, checkmarkCircleOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-client-form',
  templateUrl: './client-form.component.html',
  styleUrls: ['./client-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, 
    IonContent, IonButtons, IonButton, IonItem, IonInput, IonSelect, 
    IonSelectOption, IonSpinner, IonIcon, IonFooter, IonSegment, 
    IonSegmentButton, IonLabel, IonTextarea
  ]
})
export class ClientFormComponent implements OnInit {
  @Input() clientToEdit?: IClient;

  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);
  private toastCtrl = inject(ToastController);
  private modalCtrl = inject(ModalController);

  public form!: FormGroup;
  public isEditing = false;
  public isSubmitting = false;

  constructor() {
    addIcons({ 
      personOutline, mailOutline, callOutline, locationOutline, 
      briefcaseOutline, personCircleOutline, documentTextOutline, 
      flagOutline, checkmarkCircleOutline 
    });
  }

  ngOnInit() {
    this.isEditing = !!this.clientToEdit;
    
    this.form = this.fb.group({
      fullname: [this.clientToEdit?.fullname || '', [Validators.required, Validators.minLength(2)]],
      email: [this.clientToEdit?.email || '', [Validators.required, Validators.email]],
      phoneNumber: [this.clientToEdit?.phoneNumber || '', Validators.required],
      address: [this.clientToEdit?.address || '', Validators.required],
      clientType: [this.clientToEdit?.clientType || 'Individual', Validators.required],
      status: [this.clientToEdit?.status || 'Active', Validators.required],
      
      // Corporate Fields (Initially optional)
      primaryContactPerson: [this.clientToEdit?.primaryContactPerson || ''],
      rcNumber: [this.clientToEdit?.rcNumber || '']
    });

    // Run initial validation check
    this.onTypeChange();
  }

  onTypeChange() {
    const type = this.form.get('clientType')?.value;
    const contactControl = this.form.get('primaryContactPerson');
    const rcControl = this.form.get('rcNumber');

    if (type === 'Corporate') {
      contactControl?.setValidators(Validators.required);
      rcControl?.setValidators(Validators.required);
    } else {
      contactControl?.clearValidators();
      rcControl?.clearValidators();
      // Optional: Clear values if switching back to Individual? 
      // contactControl?.setValue('');
    }
    
    contactControl?.updateValueAndValidity();
    rcControl?.updateValueAndValidity();
  }

  async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.form.value;

    const action$ = this.isEditing
      ? this.clientService.updateClient(this.clientToEdit!.id, formValue as UpdateClientDto)
      : this.clientService.createClient(formValue as CreateClientDto);

    action$.pipe(
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: async () => {
        const message = this.isEditing ? 'Profile updated.' : 'Client onboarded successfully.';
        const toast = await this.toastCtrl.create({ message, duration: 2000, color: 'success' });
        toast.present();
        this.modalCtrl.dismiss(null, 'confirm');
      },
      error: async (err) => {
        const message = err.error?.message || 'Could not save client data.';
        const toast = await this.toastCtrl.create({ message, duration: 3000, color: 'danger' });
        toast.present();
      }
    });
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}