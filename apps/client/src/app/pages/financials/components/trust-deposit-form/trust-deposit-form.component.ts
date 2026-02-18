import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonInput, IonSpinner, IonLabel, ToastController, IonNote, IonIcon, IonText } from '@ionic/angular/standalone';
import { CreateTrustDepositDto, IMatter } from '@quickprolaw/shared-interfaces';
import { FinancialsService } from '../../../../core/services/financials.service';
import { MatterService } from '../../../../core/services/matter.service';
import { SearchableSelectComponent } from '../../../../components/searchable-select/searchable-select.component';
import { finalize, firstValueFrom } from 'rxjs';
import { addIcons } from 'ionicons';
import { chevronForward } from 'ionicons/icons';

@Component({
  selector: 'app-trust-deposit-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonInput, IonSpinner, IonLabel, IonNote, IonIcon, IonText],
  templateUrl: './trust-deposit-form.component.html',
})
export class TrustDepositFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private financialsService = inject(FinancialsService);
  private matterService = inject(MatterService);

  public form!: FormGroup;
  public isSubmitting = false;
  public selectedMatter = signal<IMatter | null>(null);

  constructor() {
    addIcons({ chevronForward });
  }

  ngOnInit() {
    this.form = this.fb.group({
      matterId: [null, Validators.required],
      description: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
    });
  }

  async openMatterSelect() {
    const matters = await firstValueFrom(this.matterService.getMattersForSelection());
    const modal = await this.modalCtrl.create({
      component: SearchableSelectComponent,
      componentProps: { items: matters, title: 'Select Matter', displayKey: 'title' }
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss<IMatter>();
    if (role === 'confirm' && data) {
      this.selectedMatter.set(data);
      this.form.patchValue({ matterId: data.id });
    }
  }

  cancel() { this.modalCtrl.dismiss(null, 'cancel'); }

  async save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSubmitting = true;
    const dto: CreateTrustDepositDto = this.form.value;
    this.financialsService.makeTrustDeposit(dto).pipe(finalize(() => this.isSubmitting = false)).subscribe({
      next: async (result) => {
        const toast = await this.toastCtrl.create({ message: 'Trust deposit recorded successfully.', duration: 2000, color: 'success' });
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