import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonList, IonItem, IonLabel, IonNote, IonSpinner, IonButton } from '@ionic/angular/standalone';
import { IInvoice } from '@quickprolaw/shared-interfaces';
import { InvoiceService } from '../../../../core/services/invoice.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-client-financials',
  templateUrl: './client-financials.component.html',
  styleUrls: ['./client-financials.component.scss'],
  standalone: true,
  imports: [CommonModule, IonList, IonItem, IonLabel, IonNote, IonSpinner]
})
export class ClientFinancialsComponent implements OnInit {
  @Input({ required: true }) clientId!: string;

  private invoiceService = inject(InvoiceService);
  private router = inject(Router);

  public status = signal<'loading' | 'loaded' | 'error'>('loading');
  public invoices = signal<IInvoice[]>([]);

  ngOnInit() {
    this.invoiceService.getInvoicesByClient(this.clientId).subscribe({
      next: (data) => {
        this.invoices.set(data);
        this.status.set('loaded');
      },
      error: () => {
        this.status.set('error');
      }
    });
  }

  viewInvoice(invoice: IInvoice) {
    // Navigate to the detailed invoice view
    this.router.navigate(['/app/financials/invoice', invoice.matter.id, invoice.id]);
  }
}