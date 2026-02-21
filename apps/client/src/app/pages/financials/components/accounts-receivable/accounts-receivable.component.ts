import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonGrid, IonRow, IonCol, IonSpinner, IonButton, IonIcon, 
  IonInfiniteScroll, IonInfiniteScrollContent, ModalController, IonLabel 
} from '@ionic/angular/standalone';
import { FinancialsService } from '../../../../core/services/financials.service';
import { Router } from '@angular/router';
import { IInvoice } from '@teddy-city-hotels/shared-interfaces';
import { addIcons } from 'ionicons';
import { folderOpenOutline } from 'ionicons/icons';
import { InvoiceFormComponent } from '../invoice-form/invoice-form.component';

@Component({
  selector: 'app-accounts-receivable',
  standalone: true,
  imports: [
    CommonModule, IonGrid, IonRow, IonCol, IonSpinner, IonButton, 
    IonIcon, IonInfiniteScroll, IonInfiniteScrollContent, IonLabel
  ],
  templateUrl: './accounts-receivable.component.html',
  styleUrls: ['./accounts-receivable.component.scss'],
})
export class AccountsReceivableComponent implements OnInit {
  public financialsService = inject(FinancialsService);
  private modalCtrl = inject(ModalController);
  private router = inject(Router);

  private currentFilters = signal({
    page: 1,
    pageSize: 20,
  });

  constructor() {
    addIcons({ folderOpenOutline });
  }

  ngOnInit() {
    // Initial load handled by Parent or here for safety
    this.loadInvoices();
  }

  loadInvoices(event?: any) {
    const filters = this.currentFilters();
    // Reset if refresh
    if (event && event.type === 'ionRefresh') {
      this.currentFilters.set({ ...filters, page: 1 });
    }

    this.financialsService.loadInvoices(this.currentFilters()).subscribe({
      complete: () => { if (event) event.target.complete(); },
      error: () => { if (event) event.target.complete(); }
    });
  }

  loadMore(event: any) {
    if (this.financialsService.invoices().length < this.financialsService.totalInvoices()) {
      this.currentFilters.update(f => ({ ...f, page: f.page + 1 }));
      this.financialsService.loadInvoices(this.currentFilters()).subscribe({
        complete: () => event.target.complete(),
        error: () => event.target.complete()
      });
    } else {
      event.target.complete();
    }
  }

  viewInvoice(invoice: IInvoice) {
    this.router.navigate(['/app/financials/invoice', invoice.matter.id, invoice.id]);
  }
}