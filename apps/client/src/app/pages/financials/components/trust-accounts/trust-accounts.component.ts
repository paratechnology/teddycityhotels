import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonGrid, IonRow, IonCol, IonSpinner, IonButton, IonIcon, IonLabel
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { FinancialsService } from '../../../../core/services/financials.service';
import { addIcons } from 'ionicons';
import { walletOutline, personCircleOutline } from 'ionicons/icons';
// Note: TrustDepositFormComponent is now opened via the Parent Page's FAB logic if preferred, 
// but we keep the logic here in case you want to trigger it from a row action later.
import { ModalController } from '@ionic/angular/standalone';
import { TrustDepositFormComponent } from '../trust-deposit-form/trust-deposit-form.component';

@Component({
  selector: 'app-trust-accounts',
  standalone: true,
  imports: [
    CommonModule, IonGrid, IonRow, IonCol, IonSpinner, IonButton, IonIcon, IonLabel
  ],
  templateUrl: './trust-accounts.component.html',
  styleUrls: ['./trust-accounts.component.scss'],
})
export class TrustAccountsComponent implements OnInit {
  public financialsService = inject(FinancialsService);
  private modalCtrl = inject(ModalController);
  private router = inject(Router);

  constructor() { 
    addIcons({ walletOutline, personCircleOutline }); 
  }

  ngOnInit() { 
    // Data loading is reactive in Parent, but safe to call here
    this.loadSummaries(); 
  }

  loadSummaries(event?: any) {
    this.financialsService.loadTrustAccountSummaries().subscribe({
      complete: () => event?.target.complete(),
      error: () => event?.target.complete()
    });
  }

  viewLedger(matterId: string) {
    this.router.navigate(['/app/financials/trust-ledger', matterId]);
  }
}