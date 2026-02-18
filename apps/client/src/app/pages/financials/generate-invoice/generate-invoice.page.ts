import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonNote, IonSpinner, IonButton, IonButtons, IonBackButton, IonListHeader, IonCheckbox, IonFooter, ToastController, IonIcon } from '@ionic/angular/standalone';
import { FinancialsService } from '../../../core/services/financials.service';
import { IUnbilledItem, CreateInvoiceDto, IInvoice } from '@quickprolaw/shared-interfaces';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-generate-invoice',
  standalone: true,
  imports: [IonIcon, CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner, IonButton, IonButtons, IonBackButton, IonFooter],
  templateUrl: './generate-invoice.page.html',
  styleUrls: ['./generate-invoice.page.scss'],
})
export class GenerateInvoicePage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private financialsService = inject(FinancialsService);
  private toastCtrl = inject(ToastController);

  public matterId = signal<string>('');
  public invoiceId = signal<string | null>(null); // For edit mode

  public status = signal<'loading' | 'success' | 'error'>('loading');
  public isCreating = signal(false);
  public unbilledItems = signal<IUnbilledItem[]>([]);
  public selectedItems = signal<Set<string>>(new Set());

  public isEditMode = computed(() => !!this.invoiceId());
  public hasSelection = computed(() => this.selectedItems().size > 0);
  public isAllSelected = computed(() => {
    const unbilled = this.unbilledItems();
    return unbilled.length > 0 && this.selectedItems().size === unbilled.length;
  });

  public totalSelectedAmount = computed(() => {
    const selectedIds = this.selectedItems();
    return this.unbilledItems()
      .filter(item => selectedIds.has(item.id))
      .reduce((sum, item) => sum + item.amount, 0);
  });

  ngOnInit() {
    const matterId = this.route.snapshot.paramMap.get('matterId');
    const invoiceId = this.route.snapshot.paramMap.get('invoiceId'); // Check for invoiceId

    if (matterId) {
      this.matterId.set(matterId);
      if (invoiceId) {
        this.invoiceId.set(invoiceId);
      }
      this.loadUnbilledItems();
    } else {
      this.status.set('error');
    }
  }

  // Combined loader for create and edit modes
  loadUnbilledItems() {
    this.status.set('loading');
    const matterId = this.matterId();

    // In edit mode, we also need the current invoice details
    if (this.isEditMode() && this.invoiceId()) {
      this.financialsService.getInvoiceById(matterId, this.invoiceId()!).subscribe(invoice => {
        const itemsFromInvoice = invoice.items.map(item => ({ ...item, date: invoice.issueDate }));
        this.loadAndMergeItems(matterId, itemsFromInvoice);
      });
    } else {
      this.loadAndMergeItems(matterId, []);
    }
  }

  private loadAndMergeItems(matterId: string, existingItems: IUnbilledItem[]) {
    this.financialsService.getUnbilledItemsForMatter(matterId).subscribe(unbilledItems => {
      const combinedItems = [...existingItems, ...unbilledItems];
      this.unbilledItems.set(combinedItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      this.selectedItems.set(new Set(existingItems.map(item => item.id)));
      this.status.set('success');
    }, () => this.status.set('error'));
  }

  toggleItemSelection(itemId: string, isChecked: boolean) {
    this.selectedItems.update(currentSet => {
      isChecked ? currentSet.add(itemId) : currentSet.delete(itemId);
      return new Set(currentSet); // Return a new set to trigger change detection
    });
  }

  toggleSelectAll(isChecked: boolean) {
    this.selectedItems.update(currentSet => {
      if (isChecked) {
        const allIds = this.unbilledItems().map(item => item.id);
        return new Set(allIds);
      } else {
        return new Set();
      }
    });
  }

  saveInvoice() {
    if (!this.hasSelection()) return;

    this.isCreating.set(true);
    const selectedIds = Array.from(this.selectedItems());
    const allItems = this.unbilledItems();

    const dto: CreateInvoiceDto = {
      type:'Legal',
      matterId: this.matterId(), // DTO needs matterId even on update for backend consistency
      installmentIds: selectedIds.filter(id => allItems.find(item => item.id === id)?.type === 'legal_fee'),
      expenseIds: selectedIds.filter(id => allItems.find(item => item.id === id)?.type === 'expense'),
    };

    const saveOperation = this.isEditMode()
      ? this.financialsService.updateInvoice(this.matterId(), this.invoiceId()!, dto)
      : this.financialsService.createInvoice(dto);

    saveOperation
      .pipe(finalize(() => this.isCreating.set(false)))
      .subscribe({
        next: async (newInvoice) => {
          const toast = await this.toastCtrl.create({
            message: `Draft invoice ${this.isEditMode() ? 'updated' : 'created'} successfully.`,
            duration: 2000,
            color: 'success'
          });
          await toast.present();
          this.router.navigate(['/app/financials/invoice', newInvoice.matter.id, newInvoice.id]);
        },
        error: async (err) => {
          const toast = await this.toastCtrl.create({
            message: err.error?.message || `Failed to ${this.isEditMode() ? 'update' : 'create'} invoice.`,
            duration: 3000,
            color: 'danger'
          });
          await toast.present();
        }
      });
  }
}