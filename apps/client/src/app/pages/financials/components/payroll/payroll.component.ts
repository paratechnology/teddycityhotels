import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonButton, AlertController, ToastController, IonSpinner, 
  IonGrid, IonRow, IonCol, IonIcon 
} from '@ionic/angular/standalone';
import { HttpErrorResponse } from '@angular/common/http';
import { FinancialsService } from '../../../../core/services/financials.service';
import { format } from 'date-fns';
import { Router, RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  walletOutline, briefcaseOutline, peopleOutline, documentTextOutline, 
  calendarOutline, chevronForward, fileTrayOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [
    CommonModule, IonSpinner, RouterLink, IonButton, 
    IonGrid, IonRow, IonCol, IonIcon
  ],
  templateUrl: './payroll.component.html',
  styleUrls: ['./payroll.component.scss']
})
export class PayrollComponent implements OnInit {
  private financialsService = inject(FinancialsService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private router = inject(Router);

  public payrollHistory = signal<{ payPeriod: string, status: 'draft' | 'finalized' }[]>([]);
  public historyLoading = signal(true);

  public currentMonth = format(new Date(), 'MMMM yyyy');
  private currentPayPeriod = format(new Date(), 'yyyy-MM');

  constructor() {
    addIcons({ 
      walletOutline, briefcaseOutline, peopleOutline, documentTextOutline, 
      calendarOutline, chevronForward, fileTrayOutline 
    });
  }

  ngOnInit() {
    this.loadPayrollHistory();
  }

  async confirmPreviewPayroll() {
    const alert = await this.alertCtrl.create({
      header: 'Preview Payroll',
      message: `Open payroll draft for ${this.currentMonth}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Proceed', role: 'confirm', handler: () => this.openOrCreateDraft(this.currentPayPeriod) }
      ]
    });
    await alert.present();
  }

  public openOrCreateDraft(payPeriod: string) {
    this.financialsService.getPayrollDraftByPeriod(payPeriod).subscribe({
      next: (draft) => {
        this.router.navigate(['/app/financials/payroll-preview', draft.id]);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.financialsService.createPayrollDraft(payPeriod).subscribe({
            next: async (newDraft) => {
              const toast = await this.toastCtrl.create({ message: 'Draft created.', duration: 2000, color: 'success' });
              toast.present();
              this.router.navigate(['/app/financials/payroll-preview', newDraft.id]);
            },
            error: async (createErr) => {
              const toast = await this.toastCtrl.create({ message: createErr.error?.message || 'Failed to create draft.', duration: 3000, color: 'danger' });
              toast.present();
            }
          });
        } else {
          this.toastCtrl.create({ message: err.error?.message || 'Error occurred.', duration: 3000, color: 'danger' }).then(t => t.present());
        }
      }
    });
  }

  private loadPayrollHistory() {
    this.historyLoading.set(true);
    this.financialsService.getPayrollHistory().subscribe({
      next: (history) => {
        this.payrollHistory.set(history);
        this.historyLoading.set(false);
      },
      error: () => {
        this.historyLoading.set(false);
      }
    });
  }

  formatPayPeriod(payPeriod: string): string {
    return format(new Date(payPeriod + '-01'), 'MMMM yyyy'); 
  }
}