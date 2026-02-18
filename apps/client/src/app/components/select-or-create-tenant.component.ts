import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ITenant } from '@quickprolaw/shared-interfaces';
import { TenantsService } from '../core/services/tenants.service';
import { addIcons } from 'ionicons';
import { personAddOutline, searchOutline } from 'ionicons/icons';

@Component({
  selector: 'app-select-or-create-tenant',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  template: `
    <ion-item lines="none" class="search-item">
      <ion-input 
        [formControl]="searchControl" 
        placeholder="Search Tenant Name..." 
        (ionFocus)="showDropdown.set(true)">
        <ion-icon slot="start" name="search-outline"></ion-icon>
      </ion-input>
    </ion-item>

    @if (showDropdown() && filteredTenants().length > 0) {
      <div class="dropdown-list">
        @for (tenant of filteredTenants(); track tenant.id) {
          <div class="list-item" (click)="selectTenant(tenant)">
            <div class="name">{{ tenant.fullname }}</div>
            <div class="meta">{{ tenant.phone }}</div>
          </div>
        }
      </div>
    }

    @if (showDropdown() && searchControl.value && filteredTenants().length === 0) {
      <div class="create-new-prompt" (click)="emitNewTenant()">
        <ion-icon name="person-add-outline"></ion-icon>
        <span>Create new tenant: "<strong>{{ searchControl.value }}</strong>"</span>
      </div>
    }
  `,
  styles: [`
    .dropdown-list {
      background: white; border: 1px solid #ddd; border-radius: 8px;
      max-height: 200px; overflow-y: auto; margin-top: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .list-item {
      padding: 10px 16px; border-bottom: 1px solid #eee; cursor: pointer;
      &:hover { background: #f9fafb; }
      .name { font-weight: 600; font-size: 0.9rem; }
      .meta { font-size: 0.75rem; color: #666; }
    }
    .create-new-prompt {
      padding: 12px; background: #eff6ff; color: #1d4ed8;
      border-radius: 8px; margin-top: 8px; cursor: pointer;
      display: flex; gap: 8px; align-items: center; font-size: 0.9rem;
    }
  `]
})
export class SelectOrCreateTenantComponent {
  private tenantsService = inject(TenantsService);

  @Output() tenantSelected = new EventEmitter<ITenant>();
  @Output() createNew = new EventEmitter<string>(); // Emit name to parent

  searchControl = new FormControl('');
  showDropdown = signal(false);
  filteredTenants = signal<ITenant[]>([]);

  constructor() {
    addIcons({ personAddOutline, searchOutline });

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
         if (!term) return [];
         return this.tenantsService.searchTenants(term);
      })
    ).subscribe(results => this.filteredTenants.set(results));
  }

  selectTenant(t: ITenant) {
    this.searchControl.setValue(t.fullname, { emitEvent: false });
    this.showDropdown.set(false);
    this.tenantSelected.emit(t);
  }

  emitNewTenant() {
    this.showDropdown.set(false);
    this.createNew.emit(this.searchControl.value || '');
  }
}