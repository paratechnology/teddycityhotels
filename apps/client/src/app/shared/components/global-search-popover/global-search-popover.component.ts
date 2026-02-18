import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonSearchbar, IonList, IonItem, IonLabel, IonSpinner, IonListHeader, PopoverController } from '@ionic/angular/standalone';
import { IGlobalSearchResult } from '@quickprolaw/shared-interfaces';
import { SearchService } from '../../../core/services/search.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-global-search-popover',
  template: `
    <ion-searchbar placeholder="Search matters, clients, files..." 
                   (ionInput)="onSearch($event)" 
                   [debounce]="300"
                   show-clear-button="always"></ion-searchbar>
    <div *ngIf="isLoading()" class="loading-spinner">
      <ion-spinner name="crescent"></ion-spinner>
    </div>
    <ion-list *ngIf="!isLoading() && results()">
      <!-- Matters -->
      <ion-list-header *ngIf="results()!.matters.length > 0">Matters</ion-list-header>
      <ion-item button *ngFor="let item of results()!.matters" (click)="navigate(item.link)">
        <ion-label>{{ item.name }}</ion-label>
      </ion-item>

      <!-- Clients -->
      <ion-list-header *ngIf="results()!.clients.length > 0">Clients</ion-list-header>
      <ion-item button *ngFor="let item of results()!.clients" (click)="navigate(item.link)">
        <ion-label>{{ item.name }}</ion-label>
      </ion-item>

      <!-- Files -->
      <ion-list-header *ngIf="results()!.files.length > 0">Files & Books</ion-list-header>
      <ion-item button *ngFor="let item of results()!.files" (click)="navigate(item.link)">
        <ion-label>{{ item.name }}</ion-label>
      </ion-item>

      <ion-item *ngIf="hasNoResults()" lines="none">
        <ion-label class="ion-text-center">No results found.</ion-label>
      </ion-item>
    </ion-list>
  `,
  styles: [`.loading-spinner { display: flex; justify-content: center; padding: 20px; }`],
  standalone: true,
  imports: [CommonModule, IonSearchbar, IonList, IonItem, IonLabel, IonSpinner, IonListHeader]
})
export class GlobalSearchPopoverComponent {
  private searchService = inject(SearchService);
  private router = inject(Router);
  private popoverCtrl = inject(PopoverController);

  private searchTerms = new Subject<string>();
  public results = signal<IGlobalSearchResult | null>(null);
  public isLoading = signal(false);

  constructor() {
    this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.isLoading.set(true)),
      switchMap((term: string) => this.searchService.search(term))
    ).subscribe(results => {
      this.results.set(results);
      this.isLoading.set(false);
    });
  }

  onSearch(event: any) {
    this.searchTerms.next(event.target.value);
  }

  hasNoResults = () => !this.results() || (this.results()!.matters.length === 0 && this.results()!.clients.length === 0 && this.results()!.files.length === 0);

  navigate(link: string) { this.router.navigateByUrl(link); this.popoverCtrl.dismiss(); }
}