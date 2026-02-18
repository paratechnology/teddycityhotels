import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton, IonSpinner, ToastController, IonButtons, IonBackButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonLabel, IonSelect, IonSelectOption, IonIcon, IonListHeader } from '@ionic/angular/standalone';
import { FirmService } from '../../../../core/services/firm.service';
import { IFirm, IDeductionRule } from '@quickprolaw/shared-interfaces';
import { addIcons } from 'ionicons';
import { addCircleOutline, removeCircleOutline } from 'ionicons/icons';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-designation-salaries',
  templateUrl: './designation-salaries.page.html',
  styleUrls: ['./designation-salaries.page.scss'],
  standalone: true,
  imports: [IonListHeader, CommonModule, ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton, IonSpinner, IonButtons, IonBackButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonLabel, IonSelect, IonSelectOption, IonIcon]
})
export class DesignationSalariesPage implements OnInit {
  private fb = inject(FormBuilder);
  private firmService = inject(FirmService);
  private toastCtrl = inject(ToastController);

  public firmProfile = signal<IFirm | null>(null);
  public form!: FormGroup;
  public isLoading = signal(true);
  public isSubmitting = signal(false);

  constructor() {
    addIcons({ addCircleOutline, removeCircleOutline });
  }

  ngOnInit() {
    this.firmService.getProfile().subscribe({
      next: (firm) => {
        this.firmProfile.set(firm);
        this.initializeForm(firm);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  private initializeForm(firm: IFirm) {
    this.form = this.fb.group({
      designations: this.fb.array(
        firm.designations.map(d => this.fb.group({
          name: [d.name],
          defaultGrossSalary: [d.defaultGrossSalary || ''],
          defaultDeductions: this.fb.array((d.defaultDeductions || []).map(ded => this.createDeductionFormGroup(ded)))
        }))
      )
    });
  }

  private createDeductionFormGroup(deduction?: IDeductionRule): FormGroup {
    return this.fb.group({
      id: [deduction?.id || uuidv4()],
      description: [deduction?.description || '', Validators.required],
      type: [deduction?.type || 'fixed', Validators.required],
      value: [deduction?.value || '', Validators.required]
    });
  }

  getDeductions(designationIndex: number): FormArray {
    return (this.designations.at(designationIndex) as FormGroup).get('defaultDeductions') as FormArray;
  }

  get designations(): FormArray {
    return this.form.get('designations') as FormArray;
  }

  async save() {
    if (this.form.invalid) return;

    this.isSubmitting.set(true);

    const originalDesignations = this.firmProfile()?.designations || [];
    const formValues = this.form.getRawValue().designations;

    // Simple check for any change
    if (JSON.stringify(originalDesignations) === JSON.stringify(formValues)) {
      const toast = await this.toastCtrl.create({ message: 'No changes to save.', duration: 2000, color: 'medium' });
      await toast.present();
      this.isSubmitting.set(false);
      return;
    }

    // We send the entire updated array, as the backend expects it.
    // The error indicates a validation issue, not a structural one.
    const finalDesignationsPayload = originalDesignations.map((orig, index) => ({
      ...orig,
      defaultGrossSalary: Number(formValues[index].defaultGrossSalary) || undefined,
      defaultDeductions: formValues[index].defaultDeductions.map((d: any) => ({ ...d, value: Number(d.value) }))
    }));

    this.firmService.updateProfile({ designations: finalDesignationsPayload }).subscribe({
      next: async () => { const toast = await this.toastCtrl.create({ message: 'Salaries updated successfully.', duration: 3000, color: 'success' }); toast.present(); this.isSubmitting.set(false); },
      error: async (err) => { const toast = await this.toastCtrl.create({ message: err.error?.message || 'Failed to update salaries.', duration: 3000, color: 'danger' }); toast.present(); this.isSubmitting.set(false); }
    })
  }

  addDeduction(designationIndex: number) {
    this.getDeductions(designationIndex).push(this.createDeductionFormGroup());
  }

  removeDeduction(designationIndex: number, deductionIndex: number) {
    this.getDeductions(designationIndex).removeAt(deductionIndex);
  }
}