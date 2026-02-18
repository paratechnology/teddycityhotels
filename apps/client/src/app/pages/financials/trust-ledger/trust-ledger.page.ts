import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, 
  IonNote, IonSpinner, IonButton, IonButtons, IonBackButton, IonRefresher, 
  IonRefresherContent, IonGrid, IonRow, IonCol, IonIcon 
} from '@ionic/angular/standalone';
import { FinancialsService } from '../../../core/services/financials.service';
import { MatterService } from '../../../core/services/matter.service';
import { ITrustTransaction } from '@quickprolaw/shared-interfaces';
import { addIcons } from 'ionicons';
import { 
  briefcaseOutline, arrowDownCircle, arrowUpCircle, receiptOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-trust-ledger',
  standalone: true,
  imports: [
    CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner, 
    IonButton, IonButtons, IonBackButton, IonRefresher, IonRefresherContent,
    IonGrid, IonRow, IonCol, IonIcon, IonLabel
  ],
  templateUrl: './trust-ledger.page.html',
  styleUrls: ['./trust-ledger.page.scss'],
})
export class TrustLedgerPage implements OnInit {
  public financialsService = inject(FinancialsService);
  public matterService = inject(MatterService);
  private route = inject(ActivatedRoute);

  private matterId = signal<string>('');

  constructor() {
    addIcons({ briefcaseOutline, arrowDownCircle, arrowUpCircle, receiptOutline });
  }

  ngOnInit() {
    const matterId = this.route.snapshot.paramMap.get('id');
    if (matterId) {
      this.matterId.set(matterId);
      this.matterService.getMatterById(matterId).subscribe();
      this.loadLedger();
    }
  }

  loadLedger(event?: any) {
    this.financialsService.getTrustLedgerForMatter(this.matterId()).subscribe({
      complete: () => event?.target.complete(),
      error: () => event?.target.complete()
    });
  }

  getTransactionSign(type: ITrustTransaction['type']) {
    return type === 'Deposit' ? '+' : '-';
  }
}