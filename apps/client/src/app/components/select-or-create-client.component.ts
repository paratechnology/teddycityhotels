import { Component, Input, Output, EventEmitter, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IClient, IClientSubset } from '@quickprolaw/shared-interfaces';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import { checkmarkCircle, addCircle } from 'ionicons/icons';

@Component({
  selector: 'app-select-or-create-client',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  template: `
    <ion-item class="input-item">
      <ion-label position="stacked">Client <ion-text color="danger">*</ion-text></ion-label>
      
      <ion-input
        [formControl]="searchControl"
        placeholder="Type to search or create new..."
        (ionFocus)="showDropdown.set(true)"
        (ionBlur)="onBlur()"
        [clearInput]="true">
      </ion-input>

      <ion-note slot="end" *ngIf="selectedClient()" color="success" class="status-note">
        <ion-icon name="checkmark-circle"></ion-icon> Existing
      </ion-note>
      <ion-note slot="end" *ngIf="!selectedClient() && searchControl.value && searchControl.value.length > 2" color="primary" class="status-note">
        <ion-icon name="add-circle"></ion-icon> New
      </ion-note>
    </ion-item>

    <div class="dropdown-list" *ngIf="showDropdown() && filteredClients().length > 0">
      <ion-list lines="none">
        <ion-item button *ngFor="let client of filteredClients()" (click)="selectClient(client)">
          <ion-label>
            <h3>{{ client.fullname }}</h3>
            <p *ngIf="client.email">{{ client.email }}</p>
          </ion-label>
        </ion-item>
      </ion-list>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: relative;
    }
    .dropdown-list {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      z-index: 9999;
      background: var(--ion-background-color);
      border: 1px solid var(--ion-border-color);
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      max-height: 200px;
      overflow-y: auto;
      border-radius: 0 0 8px 8px;
      margin-top: -1px; /* Overlap border */
    }
    .input-item {
      --overflow: visible; /* Important for dropdown to show */
      z-index: 10;
    }
    .status-note {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      font-weight: 500;
    }
  `]
})
export class SelectOrCreateClientComponent implements OnChanges {
  @Input() allClients: IClient[] = [];
  
  // 👇 FIXED: Explicitly allow 'null' to satisfy strict template checking
  @Input() initialValue: IClientSubset | null | undefined;
  
  @Output() selectionChange = new EventEmitter<IClientSubset | string>();

  searchControl = new FormControl('');
  filteredClients = signal<IClient[]>([]);
  showDropdown = signal(false);
  selectedClient = signal<IClientSubset | null>(null);

  constructor() {
    addIcons({ checkmarkCircle, addCircle });

    this.searchControl.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged()
    ).subscribe(term => {
      this.filterList(term || '');
      
      // If user types something that doesn't match the selected client, reset selection
      if (this.selectedClient() && term !== this.selectedClient()?.fullname) {
        this.selectedClient.set(null);
      }
      
      this.emitValue();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialValue']) {
      if (this.initialValue) {
        this.selectClient(this.initialValue, false);
      } else {
        // Handle reset if passed null/undefined
        this.selectedClient.set(null);
        this.searchControl.setValue('', { emitEvent: false });
      }
    }
  }

  filterList(term: string) {
    if (!term || term.length < 1) {
      this.filteredClients.set([]);
      return;
    }
    const lower = term.toLowerCase();
    const matches = this.allClients.filter(c => c.fullname.toLowerCase().includes(lower));
    this.filteredClients.set(matches);
  }

  selectClient(client: IClientSubset, emit = true) {
    this.selectedClient.set(client);
    this.searchControl.setValue(client.fullname, { emitEvent: false });
    this.showDropdown.set(false);
    if (emit) this.selectionChange.emit(client);
  }

  onBlur() {
    // Delay hiding to allow click event on list to register
    setTimeout(() => {
      this.showDropdown.set(false);
      this.emitValue();
    }, 200);
  }

  emitValue() {
    if (this.selectedClient()) {
      this.selectionChange.emit(this.selectedClient()!);
    } else {
      // Emit the raw string name for creation
      this.selectionChange.emit(this.searchControl.value || '');
    }
  }
}