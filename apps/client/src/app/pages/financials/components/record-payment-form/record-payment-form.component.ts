import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonInput, IonSpinner, IonLabel, ToastController, IonSelect, IonSelectOption, IonDatetimeButton, IonModal, IonDatetime, IonCheckbox } from '@ionic/angular/standalone';
import { CreatePaymentDto, IInvoice } from '@quickprolaw/shared-interfaces';
import { FinancialsService } from '../../../../core/services/financials.service';
import { AuthService } from '../../../../core/services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-record-payment-form',
  standalone: true,
  imports: [IonModal, IonDatetimeButton, IonDatetime, CommonModule, ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonInput, IonSpinner, IonLabel, IonSelect, IonSelectOption, IonCheckbox],
  templateUrl: './record-payment-form.component.html',
})
export class RecordPaymentFormComponent implements OnInit {
  @Input({ required: true }) invoice!: IInvoice;

  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private authService = inject(AuthService);
  private financialsService = inject(FinancialsService);

  public form!: FormGroup;
  public isSubmitting = false;
  public paymentMethods = ['Bank Transfer', 'Credit Card', 'Cash', 'Other'];

  ngOnInit() {
    const amountDue = this.invoice.totalAmount - this.invoice.amountPaid;
    this.form = this.fb.group({
      amount: [amountDue, [Validators.required, Validators.min(0.01), Validators.max(amountDue)]],
      date: [new Date().toISOString(), Validators.required],
      method: ['Bank Transfer', Validators.required],
      sendReceipt: [true]
    });
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.form.value;
    const user = this.authService.userProfile();

    if (!user) {
      const toast = await this.toastCtrl.create({ message: 'Cannot record payment. User not authenticated.', duration: 3000, color: 'danger' });
      toast.present();
      this.isSubmitting = false;
      return;
    }

    const dto: Partial<CreatePaymentDto> = {
      id: this.invoice.id, // Add the invoice ID
      clientId: this.invoice.clientId,
      invoiceIds: [this.invoice.id],
      amount: formValue.amount,
      date: formValue.date,
      method: formValue.method,
      matterId: this.invoice.matter.id,
      sendReceipt: formValue.sendReceipt,
      recordedBy: { id: user.id, fullname: user.fullname } // Add the user who recorded it
    };

    this.financialsService.recordPayment(dto)
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: async (updatedInvoice) => {
          const toast = await this.toastCtrl.create({
            message: 'Payment recorded successfully.',
            duration: 2000,
            color: 'success'
          });
          toast.present();
          this.modalCtrl.dismiss(updatedInvoice, 'confirm');
        },
        error: async (err) => {
          const toast = await this.toastCtrl.create({
            message: err.error?.message || 'Failed to record payment.',
            duration: 3000,
            color: 'danger'
          });
          toast.present();
        }
      });
  }
}