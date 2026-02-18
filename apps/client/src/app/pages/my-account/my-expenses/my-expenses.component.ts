import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, 
  IonLabel, IonChip, IonSpinner, IonIcon, IonFab, IonFabButton, 
  IonButtons, IonBackButton, IonRefresher, IonRefresherContent,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, receiptOutline, timeOutline, checkmarkCircleOutline, closeCircleOutline } from 'ionicons/icons';
import { FinancialsService } from '../../../core/services/financials.service';
import { ExpenseFormComponent } from '../../matters/components/expense-form/expense-form.component';
// You'll need a form component to create expenses
// import { ExpenseFormComponent } from '../expense-form/expense-form.component'; 

@Component({
  selector: 'app-my-expenses',
  standalone: true,
  imports: [
    CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonList, 
    IonItem, IonLabel, IonChip, IonSpinner, IonIcon, IonFab, IonFabButton,
    IonButtons, IonBackButton, IonRefresher, IonRefresherContent
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/app/profile"></ion-back-button>
        </ion-buttons>
        <ion-title>My Expense Requests</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="wrapper">
        @if (financialsService.status() === 'loading' && expenses().length === 0) {
          <div class="centered">
            <ion-spinner name="crescent"></ion-spinner>
          </div>
        } 
        @else {
          <ion-list [inset]="true">
            @for (expense of expenses(); track expense.id) {
              <ion-item lines="full">
                <ion-icon [name]="getIcon(expense.status)" [color]="getColor(expense.status)" slot="start" size="large"></ion-icon>
                <ion-label>
                  <h2>{{ expense.description }}</h2>
                  <p>{{ expense.date | date:'mediumDate' }}</p>
                  @if (expense.status === 'Rejected' && expense.rejectionReason) {
                    <p class="rejection-note text-danger">Reason: {{ expense.rejectionReason }}</p>
                  }
                </ion-label>
                <div slot="end" class="amount-col">
                  <h3>₦{{ expense.amount | number }}</h3>
                  <ion-chip [color]="getColor(expense.status)" outline="true" class="status-chip">
                    {{ expense.status }}
                  </ion-chip>
                </div>
              </ion-item>
            } @empty {
              <div class="empty-state">
                <ion-icon name="receipt-outline"></ion-icon>
                <p>You haven't submitted any expense requests.</p>
              </div>
            }
          </ion-list>
        }
      </div>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button (click)="openCreateModal()">
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: [`
    .centered { display: flex; justify-content: center; align-items: center; height: 60vh; }
    .wrapper { padding-bottom: 80px; }
    .amount-col { text-align: right; display: flex; flex-direction: column; align-items: flex-end; }
    .amount-col h3 { font-weight: bold; margin: 0 0 4px 0; font-size: 1rem; }
    .status-chip { height: 20px; font-size: 0.7rem; margin: 0; }
    .empty-state { text-align: center; padding: 40px; color: var(--ion-color-medium); }
    .empty-state ion-icon { font-size: 3rem; margin-bottom: 10px; opacity: 0.5; }
    .rejection-note { color: var(--ion-color-danger); font-size: 0.8rem; font-style: italic; }
  `]
})
export class MyExpensesComponent implements OnInit {
  public financialsService = inject(FinancialsService);
  private modalCtrl = inject(ModalController);

  // Directly access the "Personal" list we created in the service
  public expenses = this.financialsService.myOperationalExpenses;

  constructor() {
    addIcons({ add, receiptOutline, timeOutline, checkmarkCircleOutline, closeCircleOutline });
  }

  ngOnInit() {
    this.financialsService.loadMyOperationalExpenses().subscribe();
  }

  refresh(event: any) {
    this.financialsService.loadMyOperationalExpenses().subscribe(() => event.target.complete());
  }

  getIcon(status: string) {
    switch(status) {
      case 'Approved': return 'checkmark-circle-outline';
      case 'Rejected': return 'close-circle-outline';
      default: return 'time-outline';
    }
  }

  getColor(status: string) {
    switch(status) {
      case 'Approved': return 'success';
      case 'Rejected': return 'danger';
      default: return 'warning';
    }
  }

  async openCreateModal() {
    // Logic to open your Expense Creation Form
    const modal = await this.modalCtrl.create({ component: ExpenseFormComponent });
    await modal.present();
    // After dismiss, you might want to reload:
    this.financialsService.loadMyOperationalExpenses().subscribe();
  }
}