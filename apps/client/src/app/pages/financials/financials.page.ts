import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, IonSegmentButton, 
  IonLabel, IonButtons, IonFab, IonFabButton, IonIcon, ModalController, IonButton,
  IonRefresher, IonRefresherContent 
} from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth.service';
import { FinancialsService } from '../../core/services/financials.service';
import { addIcons } from 'ionicons';
import { menuOutline, add } from 'ionicons/icons';

// Import Child Components
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AccountsReceivableComponent } from './components/accounts-receivable/accounts-receivable.component';
import { OperationalExpensesComponent } from './components/operational-expenses/operational-expenses.component';
import { TrustAccountsComponent } from './components/trust-accounts/trust-accounts.component';
import { PayrollComponent } from './components/payroll/payroll.component';
import { OperationalExpenseFormComponent } from './components/operational-expense-form/operational-expense-form.component';
import { NavigationService } from '../../core/services/navigation.service';
import { TrustDepositFormComponent } from './components/trust-deposit-form/trust-deposit-form.component';

type FinancialsTab = 'dashboard' | 'accounts-receivable' | 'operational-expenses' | 'trust-accounts' | 'payroll';

@Component({
  selector: 'app-financials',
  templateUrl: './financials.page.html',
  styleUrls: ['./financials.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, 
    IonSegmentButton, IonLabel, IonButtons, IonFab, IonFabButton, IonIcon, 
    IonButton, IonRefresher, IonRefresherContent,
    DashboardComponent,
    AccountsReceivableComponent,
    OperationalExpensesComponent,
    TrustAccountsComponent,
    PayrollComponent,
  ]
})
export class FinancialsPage {
  private authService = inject(AuthService);
  private modalCtrl = inject(ModalController);
  private financialsService = inject(FinancialsService);
  public navigationService = inject(NavigationService);

  public activeSegment = signal<FinancialsTab>('dashboard');

  constructor() {
    addIcons({ menuOutline, add });

    effect(() => {
      this.loadActiveSegmentData();
    });
  }

  segmentChanged(event: any) {
    this.activeSegment.set(event.detail.value);
  }

  handleRefresh(event: any) {
    // Refresh the data for the current view
    this.loadActiveSegmentData(event);
  }

  private loadActiveSegmentData(refreshEvent?: any) {
    const segment = this.activeSegment();
    const complete = () => { if(refreshEvent) refreshEvent.target.complete(); };

    switch (segment) {
      case 'dashboard':
        // Load both stats and activity for dashboard
        Promise.all([
          this.financialsService.loadDashboardStats().toPromise(),
          this.financialsService.loadFinancialActivities().toPromise()
        ]).then(complete).catch(complete);
        break;
      case 'operational-expenses':
        this.financialsService.loadOperationalExpenses().subscribe({ next: complete, error: complete });
        break;
      case 'trust-accounts':
        this.financialsService.loadTrustAccountSummaries().subscribe({ next: complete, error: complete });
        break;
      default:
        // For tabs without specific loaders yet
        complete();
        break;
    }
  }

  async openExpenseForm() {
    const modal = await this.modalCtrl.create({
      component: OperationalExpenseFormComponent,
    });
    await modal.present();
  }


  async openTrustDepositForm() {
  const modal = await this.modalCtrl.create({
    component: TrustDepositFormComponent,
  });
  await modal.present();
}
}