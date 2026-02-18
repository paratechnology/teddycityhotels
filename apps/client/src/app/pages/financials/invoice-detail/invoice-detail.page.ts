import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner, IonButton, IonButtons, IonBackButton, IonRefresher, IonRefresherContent, IonFooter, ModalController, AlertController, ToastController, IonIcon, IonCard } from '@ionic/angular/standalone';
import { FinancialsService } from '../../../core/services/financials.service';
import { IInvoice } from '@quickprolaw/shared-interfaces';
import { finalize } from 'rxjs/operators';
import { RecordPaymentFormComponent } from '../components/record-payment-form/record-payment-form.component';
import { baseURL } from '@quickprolaw/shared-interfaces';
import { addIcons } from 'ionicons';
import { mailOutline, downloadOutline } from 'ionicons/icons';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [ CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonSpinner, RouterLink, IonButton, IonButtons, IonBackButton, IonRefresher, IonRefresherContent, IonFooter],
  templateUrl: './invoice-detail.page.html',
  styleUrls: ['./invoice-detail.page.scss'],
})
export class InvoiceDetailPage implements OnInit {
  public financialsService = inject(FinancialsService);
  private route = inject(ActivatedRoute);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  public matterId = signal<string>('');
  public invoiceId = signal<string>('');
  public isSending = signal(false);
  public isEmailing = signal(false);
  public isPayingFromTrust = signal(false);

  // Create a direct reference to the selected invoice signal
  public invoice = this.financialsService.selectedInvoice;

  constructor() {
    
    addIcons({ mailOutline, downloadOutline }); }

  public canPayFromTrust = computed(() => {
    const inv = this.invoice();
    if (!inv || !inv.client) return false;
    const trustSummary = this.financialsService.trustAccountSummaries().find(s => s.matterId === inv.matter.id);
    return trustSummary ? trustSummary.currentBalance >= (inv.totalAmount - inv.amountPaid) : false;
  });

  ngOnInit() {
    const matterId = this.route.snapshot.paramMap.get('matterId');
    const invoiceId = this.route.snapshot.paramMap.get('invoiceId');

    if (matterId && invoiceId) {
      this.matterId.set(matterId);
      this.invoiceId.set(invoiceId);
      this.loadInvoice();
      this.financialsService.loadTrustAccountSummaries().subscribe(); // Load trust balances to check for payment viability
    }
  }

  loadInvoice(event?: any) {
    this.financialsService.getInvoiceById(this.matterId(), this.invoiceId()).subscribe({
      complete: () => event?.target.complete(),
      error: () => event?.target.complete()
    });
  }

  getStatusColor(status: IInvoice['status']) {
    const colors = { 'Paid': 'success', 'Sent': 'primary', 'Overdue': 'danger', 'Draft': 'medium', 'Part-paid': 'warning' };
    return colors[status] || 'medium';
  }

  async recordPayment() {
    const invoice = this.financialsService.selectedInvoice();
    if (!invoice) return;

    const modal = await this.modalCtrl.create({
      component: RecordPaymentFormComponent,
      componentProps: { invoice }
    });
    await modal.present();
  }

  async confirmPayFromTrust() {
    const alert = await this.alertCtrl.create({
      header: 'Pay from Trust',
      message: 'This will withdraw the full amount due from the matter\'s trust account to pay this invoice. This action cannot be undone. Proceed?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Pay Invoice', role: 'confirm', handler: () => this.payFromTrust() }
      ]
    });
    await alert.present();
  }

  private payFromTrust() {
    this.isPayingFromTrust.set(true);
    this.financialsService.payInvoiceFromTrust(this.matterId(), this.invoiceId())
      .pipe(finalize(() => this.isPayingFromTrust.set(false)))
      .subscribe({
        next: async () => {
          const toast = await this.toastCtrl.create({ message: 'Invoice paid successfully from trust account.', duration: 3000, color: 'success' });
          toast.present();
        },
        error: async (err) => {
          const toast = await this.toastCtrl.create({ message: err.error?.message || 'Failed to pay from trust.', duration: 4000, color: 'danger' });
          toast.present();
        }
      });
  }

  async confirmSendInvoice() {
    const alert = await this.alertCtrl.create({
      header: 'Send Invoice',
      message: 'This will mark the invoice as sent and make it available for payment. This action cannot be undone. Proceed?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Send', role: 'confirm', handler: () => this.sendInvoice() }
      ]
    });
    await alert.present();
  }

  private sendInvoice() {
    this.isSending.set(true);
    this.financialsService.sendInvoice(this.matterId(), this.invoiceId())
      .pipe(finalize(() => this.isSending.set(false)))
      .subscribe();
  }

  async confirmEmailInvoice() {
    const alert = await this.alertCtrl.create({
      header: 'Email Invoice',
      message: 'This will send a copy of the invoice to the client\'s registered email address. Proceed?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Send Email', role: 'confirm', handler: () => this.emailInvoice() }
      ]
    });
    await alert.present();
  }

  private emailInvoice() {
    this.isEmailing.set(true);
    this.financialsService.emailInvoice(this.matterId(), this.invoiceId())
      .pipe(finalize(() => this.isEmailing.set(false)))
      .subscribe({
        next: async () => { const toast = await this.toastCtrl.create({ message: 'Invoice email has been sent.', duration: 3000, color: 'success' }); toast.present(); },
        error: async (err) => { const toast = await this.toastCtrl.create({ message: err.error?.message || 'Failed to send email.', duration: 4000, color: 'danger' }); toast.present(); }
      });
  }

  downloadPdf() {
    window.open(`${baseURL}financials/invoices/${this.matterId()}/${this.invoiceId()}/download`, '_blank');
  }


  // Add this method to your class
getStatusClass(status: string): string {
  switch (status) {
    case 'Paid': return 'status-paid';
    case 'Sent': return 'status-sent';
    case 'Overdue': return 'status-overdue';
    case 'Draft': return 'status-draft';
    default: return 'status-draft';
  }
}
}