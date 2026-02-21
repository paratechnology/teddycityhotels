import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, 
  IonSpinner, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, 
  IonItem, IonLabel, IonNote, IonButton, IonIcon, ToastController, 
  IonListHeader, IonGrid, IonRow, IonCol, IonChip 
} from '@ionic/angular/standalone';
import { FinancialsService } from '../../../../core/services/financials.service';
import { IPayslip } from '@teddy-city-hotels/shared-interfaces';
import { addIcons } from 'ionicons';
import { mailOutline, downloadOutline, shareOutline, walletOutline, trendingDownOutline, trendingUpOutline } from 'ionicons/icons';

@Component({
  selector: 'app-payslip-detail',
  templateUrl: './payslip-detail.page.html',
  styleUrls: ['./payslip-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
    IonContent, IonSpinner, IonLabel, IonButton, IonIcon,
    IonGrid,
    IonRow,
    IonCol
]
})
export class PayslipDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private financialsService = inject(FinancialsService);
  private toastCtrl = inject(ToastController);

  public payslip = signal<IPayslip | null>(null);
  public status = signal<'loading' | 'success' | 'error'>('loading');
  public isSendingEmail = signal(false);

  constructor() {
    addIcons({ mailOutline, downloadOutline, shareOutline, walletOutline, trendingDownOutline, trendingUpOutline });
  }

  ngOnInit() {
    const payslipId = this.route.snapshot.paramMap.get('id');
    if (payslipId) {
      this.financialsService.getPayslipById(payslipId).subscribe({
        next: (data) => {
          this.payslip.set(data);
          this.status.set('success');
        },
        error: () => this.status.set('error')
      });
    } else {
      this.status.set('error');
    }
  }

  async emailPayslip() {
    const payslipId = this.payslip()?.id;
    if (!payslipId) return;

    this.isSendingEmail.set(true);
    this.financialsService.emailMyPayslip(payslipId).subscribe({
      next: async (res) => {
        const toast = await this.toastCtrl.create({ message: res.message, duration: 3000, color: 'success' });
        await toast.present();
        this.isSendingEmail.set(false);
      },
      error: async (err) => {
        const toast = await this.toastCtrl.create({ message: err.error?.message || 'Could not send email.', duration: 3000, color: 'danger' });
        await toast.present();
        this.isSendingEmail.set(false);
      }
    });
  }
}