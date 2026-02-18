import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent,  IonLabel, 
  IonSpinner, IonButton, IonRefresher, IonRefresherContent, IonButtons, IonIcon } from '@ionic/angular/standalone';
import { FinancialsService } from '../../../../core/services/financials.service';
import { NavigationService } from '../../../../core/services/navigation.service';
import { addIcons } from 'ionicons';
import { chevronForward, documentTextOutline, receiptOutline, menuOutline } from 'ionicons/icons';

@Component({
  selector: 'app-my-payslips',
  standalone: true,
  imports: [ 
    CommonModule, IonHeader, IonToolbar, IonButtons, IonTitle, IonContent, 
    IonLabel, IonSpinner, IonButton, IonRefresher, IonRefresherContent, IonIcon
  ],
  templateUrl: './my-payslips.component.html',
  styleUrls: ['./my-payslips.component.scss'],
})
export class MyPayslipsComponent implements OnInit {
  public financialsService = inject(FinancialsService);
  public navigationService = inject(NavigationService);
  private router = inject(Router);

  constructor() {
    addIcons({ chevronForward, documentTextOutline, receiptOutline, menuOutline });
  }

  ngOnInit() { 
    this.loadPayslips(); 
  }

  loadPayslips(event?: any) {
    this.financialsService.loadMyPayslips().subscribe({
      complete: () => event?.target.complete(),
      error: () => event?.target.complete()
    });
  }

  viewPayslipDetails(payslipId: string) {
    this.router.navigate(['/app/my-payslips', payslipId]);
  }
}