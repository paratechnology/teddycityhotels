import { Component, Input, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonSearchbar, IonList, IonItem, IonLabel, IonNote, IonCheckbox } from '@ionic/angular/standalone';

@Component({
  selector: 'app-searchable-select',
  templateUrl: './searchable-select.component.html',
  styleUrls: ['./searchable-select.component.scss'],
  standalone: true,
  imports: [IonCheckbox, CommonModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonSearchbar, IonList, IonItem, IonLabel, IonNote],
})
export class SearchableSelectComponent {
  @Input() items: any[] = [];
  @Input() title!: string;
  @Input() displayKey!: string;
  @Input() itemKey = 'id'; // Key to use for tracking selected items, defaults to 'id'
  @Input() multiple = false;
  @Input() initiallySelected: any[] = [];
  @Input() searchKey?: string;

  private modalCtrl = inject(ModalController);
  private searchTerm = signal('');

  filteredItems = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) {
      return this.items;
    }
    const key = this.searchKey || this.displayKey;
    return this.items.filter(item => item[key]?.toLowerCase().includes(term));
  });

  selectionMap: Record<string, boolean> = {};

  ngOnInit() {
    if (this.multiple) {
      // Initialize map of selected items
      const selectedIds = new Set(this.initiallySelected.map(item => item[this.itemKey]));
      for (const item of this.items) {
        this.selectionMap[item[this.itemKey]] = selectedIds.has(item[this.itemKey]);
      }
    }
  }

  handleSearch(event: any) {
    this.searchTerm.set(event.target.value || '');
  }

  selectItem(item: any) {
    if (this.multiple) {
      this.selectionMap[item[this.itemKey]] = !this.selectionMap[item[this.itemKey]];
    } else {
      this.modalCtrl.dismiss(item, 'confirm');
    }
  }

  confirm() {
    const selectedItems = this.items.filter(item => this.selectionMap[item[this.itemKey]]);
    this.modalCtrl.dismiss(selectedItems, 'confirm');
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}