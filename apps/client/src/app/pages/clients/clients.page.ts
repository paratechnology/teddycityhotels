import { Component, OnDestroy, OnInit, WritableSignal, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonLabel, 
  IonSpinner, IonSearchbar, IonRefresher, IonRefresherContent, IonInfiniteScroll, 
  IonInfiniteScrollContent, IonFab, IonFabButton, IonIcon, IonButton, 
  IonButtons, ModalController, ActionSheetController, IonChip 
} from '@ionic/angular/standalone';
import { Subject, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { IClient } from '@quickprolaw/shared-interfaces';
import { ClientService, ClientFilters } from '../../core/services/client.service';
import { addIcons } from 'ionicons';
import { 
  add, menuOutline, peopleOutline, callOutline, mailOutline, 
  business, chevronDownOutline 
} from 'ionicons/icons';
import { NavigationService } from '../../core/services/navigation.service';
import { ClientFormComponent } from './components/client-form/client-form.component';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.page.html',
  styleUrls: ['./clients.page.scss'],
  standalone: true,
  imports: [
    IonButtons, IonButton, CommonModule, IonContent, IonHeader, IonTitle, 
    IonToolbar, IonLabel, IonSpinner, IonSearchbar, 
    IonRefresher, IonRefresherContent, IonInfiniteScroll, IonInfiniteScrollContent, 
    IonFab, IonFabButton, IonIcon, IonChip
  ]
})
export class ClientsPage implements OnInit, OnDestroy {
  public clientService = inject(ClientService);
  private router = inject(Router);
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  public navigationService = inject(NavigationService);
  private modalCtrl = inject(ModalController);
  private actionSheetCtrl = inject(ActionSheetController);

  public currentFilters: WritableSignal<ClientFilters> = signal({
    page: 1,
    pageSize: 20,
    search: '',
    status: 'all',
    type: 'all'
  });

  constructor() {
    addIcons({ 
      add, menuOutline, peopleOutline, callOutline, mailOutline, 
      business, chevronDownOutline 
    });
  }

  ionViewWillEnter() {
    this.clientService.refreshClients(this.currentFilters()).subscribe();
  }

  ngOnInit() {
    this.searchSubject.pipe(
      // Removed debounceTime(500) to rely on the ion-searchbar's [debounce]="500"
      // This prevents the "double wait" lag that makes search feel unresponsive.
      distinctUntilChanged(),
      switchMap(searchQuery => {
        this.currentFilters.update(f => ({ ...f, search: searchQuery.trim(), page: 1 }));
        this.scrollToTop(); // Ensure we see the top results
        return this.clientService.refreshClients(this.currentFilters());
      }),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private scrollToTop() {
    const contentEl = document.querySelector('ion-content');
    if (contentEl && 'scrollToTop' in contentEl) {
      (contentEl as any).scrollToTop(300);
    }
  }

  onSearchChange(event: any) {
    this.searchSubject.next(event.target.value);
  }

  handleRefresh(event: any) {
    this.clientService.refreshClients(this.currentFilters()).subscribe(() => {
      event.target.complete();
    });
  }

  onIonInfinite(event: any) {
    if (this.clientService.totalClients() > this.clientService.clients().length) {
      this.currentFilters.update(f => ({ ...f, page: f.page + 1 }));
      this.clientService.loadClients(this.currentFilters()).subscribe(() => event.target.complete());
    } else {
      event.target.disabled = true;
    }
  }

  openClientDetail(clientId: string) {
    this.router.navigate(['/app/clients', clientId]);
  }

  async openClientForm(client?: IClient) {
    const modal = await this.modalCtrl.create({
      component: ClientFormComponent,
      componentProps: { clientToEdit: client }
    });
    await modal.present();

    const { role } = await modal.onWillDismiss();
    if (role === 'confirm') {
      this.handleRefresh({ target: { complete: () => { } } });
    }
  }

  // --- NEW: Filter Logic ---
  async toggleStatusFilter() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Filter by Status',
      buttons: [
        { text: 'All Clients', handler: () => this.applyFilter('status', 'all') },
        { text: 'Active', handler: () => this.applyFilter('status', 'Active') },
        { text: 'Prospects', handler: () => this.applyFilter('status', 'Prospect') },
        { text: 'Archived', handler: () => this.applyFilter('status', 'Archived') },
        { text: 'Cancel', role: 'cancel' }
      ]
    });
    await actionSheet.present();
  }

  async toggleTypeFilter() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Filter by Type',
      buttons: [
        { text: 'All Types', handler: () => this.applyFilter('type', 'all') },
        { text: 'Individuals', handler: () => this.applyFilter('type', 'Individual') },
        { text: 'Corporate', handler: () => this.applyFilter('type', 'Corporate') },
        { text: 'Cancel', role: 'cancel' }
      ]
    });
    await actionSheet.present();
  }

  applyFilter(key: 'status' | 'type', value: any) {
    this.currentFilters.update(f => ({ ...f, [key]: value, page: 1 }));
    this.clientService.refreshClients(this.currentFilters()).subscribe();
  }

  // --- NEW: Quick Contact ---
  contactClient(event: Event, method: 'call' | 'mail', value: string) {
    event.stopPropagation(); // Prevent opening detail view
    if (!value) return;
    const link = method === 'call' ? `tel:${value}` : `mailto:${value}`;
    window.location.href = link;
  }
}