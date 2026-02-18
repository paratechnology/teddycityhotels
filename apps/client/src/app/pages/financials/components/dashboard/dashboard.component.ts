import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { IonSpinner, IonLabel, IonButton, IonIcon, IonContent, IonRefresherContent, IonRefresher, IonList, IonItem, IonGrid, IonRow, IonCard, IonCol } from '@ionic/angular/standalone';
import { FinancialsService } from '../../../../core/services/financials.service';
import { addIcons } from 'ionicons';
import { cashOutline, alertCircleOutline, receiptOutline, chevronForward } from 'ionicons/icons';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [  
    IonItem, IonList,
    CommonModule, CurrencyPipe, DatePipe,
     IonSpinner, IonLabel, IonIcon
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  public financialsService = inject(FinancialsService);
  private router = inject(Router);

  constructor() {
    addIcons({ cashOutline, alertCircleOutline, receiptOutline, chevronForward });
  }

  ngOnInit() {
    this.loadAllData();
  }
  
  loadAllData() {
    this.financialsService.loadDashboardStats().subscribe();
    // this.financialsService.loadFinancialActivities().subscribe();
  }

  handleRefresh(event?: any) {
    this.financialsService.loadDashboardStats().subscribe({
      complete: () => event?.target.complete(),
      error: () => event?.target.complete()
    });
    this.financialsService.loadFinancialActivities().subscribe();
  }

  navigateTo(link: string) {
    this.router.navigateByUrl(link);
  }
}