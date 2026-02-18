import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, 
  IonSpinner, IonAccordionGroup, IonAccordion, IonItem, IonLabel, IonNote, 
  IonInput, IonButton, IonIcon, AlertController, ToastController 
} from '@ionic/angular/standalone';
import { FinancialsService } from '../../../../core/services/financials.service';
import { IPayrollDraft, IPayrollDraftItem } from '@quickprolaw/shared-interfaces';
import { addIcons } from 'ionicons';
import { 
  addCircleOutline, removeCircleOutline, saveOutline, calendarOutline, 
  checkmarkDoneCircleOutline 
} from 'ionicons/icons';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-payroll-preview',
  templateUrl: './payroll-preview.page.html',
  styleUrls: ['./payroll-preview.page.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, IonHeader, IonToolbar, IonButtons, 
    IonBackButton, IonTitle, IonContent, IonSpinner, IonAccordionGroup, 
    IonAccordion, IonItem, IonLabel, IonInput, IonButton, IonIcon
  ]
})
export class PayrollPreviewPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private financialsService = inject(FinancialsService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  public draftId = this.route.snapshot.paramMap.get('draftId');
  public draft = signal<IPayrollDraft | null>(null);
  public status = signal<'loading' | 'success' | 'error'>('loading');
  public isSaving = signal(false);
  public isFinalizing = signal(false);

  public payrollForm!: FormGroup;

  public totalNetPayroll = computed(() => {
    if (!this.payrollForm) return 0;
    return this.payrollForm.value.items.reduce((total: number, item: any) => total + this.calculateNetSalary(item), 0);
  });

  constructor() {
    addIcons({ 
      addCircleOutline, removeCircleOutline, saveOutline, calendarOutline,
      checkmarkDoneCircleOutline 
    });
  }

  ngOnInit() {
    if (this.draftId) {
      this.financialsService.getPayrollDraft(this.draftId).subscribe({
        next: (data) => {
          this.draft.set(data);
          this.buildForm(data);
          this.status.set('success');
        },
        error: () => this.status.set('error')
      });
    } else {
      this.status.set('error');
    }
  }

  private buildForm(draft: IPayrollDraft) {
    this.payrollForm = this.fb.group({
      items: this.fb.array(draft.items.map(item => this.createItemFormGroup(item)))
    });
  }

  private createItemFormGroup(item: IPayrollDraftItem): FormGroup {
    return this.fb.group({
      userId: [item.userId],
      fullname: [item.fullname],
      designation: [item.designation], // Ensure this exists in your interface/data
      grossSalary: [item.grossSalary],
      deductions: this.fb.array(item.deductions.map(d => this.fb.group(d))),
      adjustments: this.fb.array(item.adjustments.map(adj => this.createAdjustmentFormGroup(adj.description, adj.amount)))
    });
  }

  private createAdjustmentFormGroup(description = '', amount: number | string = ''): FormGroup {
    return this.fb.group({
      id: [uuidv4()],
      description: [description],
      amount: [amount]
    });
  }

  get payrollItems(): FormArray {
    return this.payrollForm.get('items') as FormArray;
  }

  getAdjustments(itemIndex: number): FormArray {
    return (this.payrollItems.at(itemIndex) as FormGroup).get('adjustments') as FormArray;
  }

  addAdjustment(itemIndex: number) {
    this.getAdjustments(itemIndex).push(this.createAdjustmentFormGroup());
  }

  removeAdjustment(itemIndex: number, adjIndex: number) {
    this.getAdjustments(itemIndex).removeAt(adjIndex);
  }

  calculateNetSalary(item: any): number {
    const totalDeductions = item.deductions.reduce((sum: number, d: any) => sum + d.amount, 0);
    const totalAdjustments = item.adjustments.reduce((sum: number, adj: any) => sum + (Number(adj.amount) || 0), 0);
    return item.grossSalary - totalDeductions + totalAdjustments;
  }

  async saveAdjustments() {
    if (!this.draftId) return;
    this.isSaving.set(true);
    const updatedItems = this.payrollForm.value.items;

    this.financialsService.updatePayrollDraft(this.draftId, { items: updatedItems }).subscribe({
      next: async () => {
        const toast = await this.toastCtrl.create({ message: 'Draft saved.', duration: 2000, color: 'success' });
        toast.present();
        this.isSaving.set(false);
      },
      error: async () => {
        const toast = await this.toastCtrl.create({ message: 'Save failed.', duration: 3000, color: 'danger' });
        toast.present();
        this.isSaving.set(false);
      }
    });
  }

  async confirmFinalize() {
    const alert = await this.alertCtrl.create({
      header: 'Confirm Finalization',
      message: 'This will lock the payroll and distribute payslips. Continue?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Finalize', role: 'confirm', handler: () => this.finalize() }
      ]
    });
    await alert.present();
  }

  private finalize() {
    if (!this.draftId) return;
    this.isFinalizing.set(true);
    this.financialsService.finalizePayroll(this.draftId).subscribe(async () => {
      const toast = await this.toastCtrl.create({ message: 'Payroll finalized successfully.', duration: 4000, color: 'success' });
      toast.present();
      this.router.navigate(['/app/financials']);
    });
  }
}