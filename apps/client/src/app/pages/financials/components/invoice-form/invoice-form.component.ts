import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonSpinner, IonLabel, ToastController, IonNote, IonIcon, IonText, IonListHeader, IonCheckbox, IonItemDivider } from '@ionic/angular/standalone';
import { CreateInvoiceDto, IMatter, IUnbilledItem } from '@quickprolaw/shared-interfaces';
import { FinancialsService } from '../../../../core/services/financials.service';
import { MatterService } from '../../../../core/services/matter.service';
import { SearchableSelectComponent } from '../../../../components/searchable-select/searchable-select.component';
import { finalize, firstValueFrom } from 'rxjs';
import { addIcons } from 'ionicons';
import { chevronForward } from 'ionicons/icons';

type InvoiceFormStep = 'select_matter' | 'review_items';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonSpinner, IonLabel, IonNote, IonIcon, IonListHeader, IonCheckbox, IonItemDivider],
  templateUrl: './invoice-form.component.html',
  styleUrls: ['./invoice-form.component.scss'],
})
export class InvoiceFormComponent {
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private financialsService = inject(FinancialsService);
  private matterService = inject(MatterService);

  public currentStep = signal<InvoiceFormStep>('select_matter');
  public isSubmitting = signal(false);
  public isLoadingItems = signal(false);

  public selectedMatter = signal<IMatter | null>(null);
  public unbilledItems = signal<IUnbilledItem[]>([]);
  public selectedItemIds = signal<Set<string>>(new Set());

  public invoiceSummary = computed(() => {
    const subtotal = this.unbilledItems()
      .filter(item => this.selectedItemIds().has(item.id))
      .reduce((sum, item) => sum + item.amount, 0);
    return { subtotal, tax: 0, total: subtotal };
  });

  constructor() {
    addIcons({ chevronForward });
  }

  async openMatterSelect() {
    const matters = await firstValueFrom(this.matterService.getMattersForSelection());
    const modal = await this.modalCtrl.create({
      component: SearchableSelectComponent,
      componentProps: { items: matters, title: 'Select Matter', displayKey: 'title' }
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss<IMatter>();
    if (role === 'confirm' && data) {
      this.selectedMatter.set(data);
      this.loadUnbilledItems(data.id);
    }
  }

  loadUnbilledItems(matterId: string) {
    this.isLoadingItems.set(true);
    this.financialsService.getUnbilledItemsForMatter(matterId)
      .pipe(finalize(() => this.isLoadingItems.set(false)))
      .subscribe(items => {
        this.unbilledItems.set(items);
        // Pre-select all items by default
        this.selectedItemIds.set(new Set(items.map(item => item.id)));
        this.currentStep.set('review_items');
      });
  }

  toggleItemSelection(itemId: string, isChecked: boolean) {
    this.selectedItemIds.update(currentSet => {
      isChecked ? currentSet.add(itemId) : currentSet.delete(itemId);
      return new Set(currentSet); // Return a new set to trigger computed signal
    });
  }

  goBackToMatterSelect() {
    this.currentStep.set('select_matter');
    this.selectedMatter.set(null);
    this.unbilledItems.set([]);
  }

  cancel() { this.modalCtrl.dismiss(null, 'cancel'); }

  async createInvoice() {
    if (this.selectedItemIds().size === 0) {
      const toast = await this.toastCtrl.create({ message: 'Please select at least one item to include.', duration: 2000, color: 'warning' });
      toast.present();
      return;
    }

    this.isSubmitting.set(true);
    const dto: CreateInvoiceDto = {
      type:'Legal',
      matterId: this.selectedMatter()!.id,
      installmentIds: this.unbilledItems().filter(i => i.type === 'legal_fee' && this.selectedItemIds().has(i.id)).map(i => i.id),
      expenseIds: this.unbilledItems().filter(i => i.type === 'expense' && this.selectedItemIds().has(i.id)).map(i => i.id),
    };

    this.financialsService.createInvoice(dto)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: async (result) => {
          const toast = await this.toastCtrl.create({ message: 'Invoice created successfully.', duration: 2000, color: 'success' });
          toast.present();
          this.modalCtrl.dismiss(result, 'confirm');
        },
        error: async (err) => {
          const toast = await this.toastCtrl.create({ message: err.error?.message || 'Failed to create invoice.', duration: 3000, color: 'danger' });
          toast.present();
        }
      });
  }
}