import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonInput, IonSelect, IonSelectOption, IonSpinner, IonLabel, IonDatetime, IonDatetimeButton, IonModal, ToastController } from '@ionic/angular/standalone';
import { CreateOperationalExpenseDto, OperationalExpenseCategory } from '@teddy-city-hotels/shared-interfaces';
import { FinancialsService } from '../../../../core/services/financials.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-operational-expense-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonInput, IonSelect, IonSelectOption, IonSpinner, IonLabel, IonDatetime, IonDatetimeButton, IonModal],
  templateUrl: './operational-expense-form.component.html',
})
export class OperationalExpenseFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private financialsService = inject(FinancialsService);

  public form!: FormGroup;
  public isSubmitting = false;
  public categories = OperationalExpenseCategory;

  ngOnInit() {
    this.form = this.fb.group({
      date: [new Date().toISOString(), Validators.required],
      category: [null, Validators.required],
      description: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
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
    const dto: CreateOperationalExpenseDto = this.form.value;

    this.financialsService.createOperationalExpense(dto)
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: async (result) => {
          const toast = await this.toastCtrl.create({ message: 'Expense request submitted.', duration: 2000, color: 'success' });
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