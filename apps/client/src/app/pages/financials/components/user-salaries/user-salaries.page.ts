import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonInput, IonButton, IonSpinner, ToastController, IonButtons, IonBackButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonNote, IonItemDivider } from '@ionic/angular/standalone';
import { FirmService } from '../../../../core/services/firm.service';
import { IFirm, IFirmUser } from '@quickprolaw/shared-interfaces';

@Component({
  selector: 'app-user-salaries',
  templateUrl: './user-salaries.page.html',
  standalone: true,
  imports: [IonItemDivider, CommonModule, ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonInput, IonButton, IonSpinner, IonButtons, IonBackButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonNote]
})
export class UserSalariesPage implements OnInit {
  private fb = inject(FormBuilder);
  private firmService = inject(FirmService);
  private toastCtrl = inject(ToastController);

  public users = signal<IFirmUser[]>([]);
  public designations = signal<IFirm['designations']>([]);
  public form!: FormGroup;
  public isLoading = signal(true);
  public isSubmitting = signal(false);

  constructor() { }

  ngOnInit() {
    // Fetch both users and firm profile to get designations
    Promise.all([
      this.firmService.getUsers().toPromise(),
      this.firmService.getProfile().toPromise()
    ]).then(([users, firm]) => {
      if (users) this.users.set(users);
      if (firm) this.designations.set(firm.designations);
      this.initializeForm();
      this.isLoading.set(false);
    }).catch(() => this.isLoading.set(false));
  }

  private initializeForm() {
    this.form = this.fb.group({
      users: this.fb.array(
        this.users().map(u => this.fb.group({
          userId: [u.id],
          fullname: [u.fullname],
          designation: [u.designation],
          overrideSalary: [u.salaryOverrides?.grossSalary || '']
        }))
      )
    });
  }

  get userControls(): FormArray {
    return this.form.get('users') as FormArray;
  }

  getDefaultSalary(designationName: string): number | undefined {
    const designation = this.designations().find(d => d.name === designationName);
    return designation?.defaultGrossSalary;
  }

  async save() {
    if (this.form.invalid) return;

    this.isSubmitting.set(true);
    const formValues = this.form.value.users;
    const updatePromises: Promise<any>[] = [];

    for (const userValue of formValues) {
      const originalUser = this.users().find(u => u.id === userValue.userId);
      const newOverride = Number(userValue.overrideSalary) || undefined;
      const oldOverride = originalUser?.salaryOverrides?.grossSalary;

      // Only send an update if the value has actually changed
      if (newOverride !== oldOverride) {
        const payload = {
          salaryOverrides: {
            grossSalary: newOverride
          }
        };
        updatePromises.push(this.firmService.updateFirmUserProfile(userValue.userId, payload).toPromise());
      }
    }

    try {
      await Promise.all(updatePromises);
      const toast = await this.toastCtrl.create({ message: 'User salaries updated successfully.', duration: 3000, color: 'success' });
      toast.present();
    } catch (err: any) {
      const toast = await this.toastCtrl.create({ message: err.error?.message || 'Failed to update salaries.', duration: 3000, color: 'danger' });
      toast.present();
    } finally {
      this.isSubmitting.set(false);
    }
  }
}