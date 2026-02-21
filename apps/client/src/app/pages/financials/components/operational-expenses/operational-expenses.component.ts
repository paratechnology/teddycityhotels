import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonList, IonItem, IonLabel, IonChip, IonSpinner, IonButton, IonIcon, 
  IonItemSliding, IonItemOptions, IonItemOption 
} from '@ionic/angular/standalone';
import { AuthService } from '../../../../core/services/auth.service';
import { FinancialsService } from '../../../../core/services/financials.service';
import { IOperationalExpense, UpdateOperationalExpenseStatusDto } from '@teddy-city-hotels/shared-interfaces';
import { addIcons } from 'ionicons';
import { add, checkmark, close, receiptOutline } from 'ionicons/icons';
import { AlertController, ToastController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-operational-expenses',
  standalone: true,
  imports: [
    CommonModule, IonList, IonItem, IonLabel, IonChip, IonSpinner, 
    IonButton, IonIcon, IonItemSliding, IonItemOptions, IonItemOption
  ],
  templateUrl: './operational-expenses.component.html',
  styleUrls: ['./operational-expenses.component.scss'],
})
export class OperationalExpensesComponent implements OnInit {
  private authService = inject(AuthService);
  public financialsService = inject(FinancialsService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  public operationalExpenses = this.financialsService.operationalExpenses;
  
  public isAdmin = computed(() => {
    const user = this.authService.userProfile();
    return user?.roles.canBill;
  });

  constructor() {
    addIcons({ add, checkmark, close, receiptOutline });
  }

  ngOnInit() {
    // Parent handles main load, but safe to call here too
    this.loadExpenses();
  }

  loadExpenses() {
    this.financialsService.loadOperationalExpenses().subscribe();
  }

  getStatusColor(status: IOperationalExpense['status']) {
    switch (status) {
      case 'Approved': return 'success';
      case 'Pending': return 'warning';
      case 'Rejected': return 'danger';
      default: return 'medium';
    }
  }

  async handleApproval(expense: IOperationalExpense, status: 'Approved' | 'Rejected') {
    if (!this.isAdmin()) return;

    const alert = await this.alertCtrl.create({
      header: `Confirm ${status}`,
      message: `Are you sure you want to ${status.toLowerCase()} this expense request of ₦${expense.amount.toLocaleString()}?`,
      inputs: status === 'Rejected' ? [{ name: 'rejectionReason', type: 'textarea', placeholder: 'Reason for rejection' }] : [],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: status,
          role: 'confirm',
          handler: (data) => {
            const dto: UpdateOperationalExpenseStatusDto = { status };
            if (status === 'Rejected' && data.rejectionReason) {
              dto.rejectionReason = data.rejectionReason;
            }
            this.updateStatus(expense.id, dto);
          }
        }
      ]
    });
    await alert.present();
  }

  private updateStatus(expenseId: string, dto: UpdateOperationalExpenseStatusDto) {
    this.financialsService.updateExpenseStatus(expenseId, dto).subscribe({
      next: async () => {
        const toast = await this.toastCtrl.create({ message: `Expense updated.`, duration: 2000, color: 'success' });
        toast.present();
      },
      error: async (err) => {
        const toast = await this.toastCtrl.create({ message: 'Failed to update status.', duration: 3000, color: 'danger' });
        toast.present();
      }
    });
  }
}