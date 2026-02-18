import { Component, inject } from '@angular/core';
import { IonicModule, PopoverController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { briefcaseOutline, receiptOutline, alarmOutline, closeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-quick-action-menu',
  standalone: true,
  imports: [IonicModule],
  template: `
    <ion-list lines="none" class="action-list">
      
      <ion-item button detail="false" (click)="select('matter')" class="action-item">
        <div slot="start" class="icon-box color-blue">
          <ion-icon name="briefcase-outline"></ion-icon>
        </div>
        <div class="text-content">
          <ion-label class="title">New Matter</ion-label>
          <ion-note class="subtitle">Open a new case file</ion-note>
        </div>
      </ion-item>

      <ion-item button detail="false" (click)="select('expense')" class="action-item">
        <div slot="start" class="icon-box color-orange">
          <ion-icon name="receipt-outline"></ion-icon>
        </div>
        <div class="text-content">
          <ion-label class="title">Log Expense</ion-label>
          <ion-note class="subtitle">Billable or firm cost</ion-note>
        </div>
      </ion-item>

      <ion-item button detail="false" (click)="select('deadline')" class="action-item">
        <div slot="start" class="icon-box color-red">
          <ion-icon name="alarm-outline"></ion-icon>
        </div>
        <div class="text-content">
          <ion-label class="title">Add Deadline</ion-label>
          <ion-note class="subtitle">Hearing or filing date</ion-note>
        </div>
      </ion-item>

    </ion-list>
  `,
  styles: [`
    .action-list {
      padding: 8px;
      background: var(--ion-background-color);
    }

    .action-item {
      --padding-start: 8px;
      --padding-end: 8px;
      --inner-padding-end: 0;
      border-radius: 12px;
      margin-bottom: 4px;
      
      /* Hover effect */
      &:hover {
        --background: var(--ion-color-step-50);
      }
    }

    /* Custom Icon Styling */
    .icon-box {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      margin-right: 12px;
      
      &.color-blue { background: rgba(var(--ion-color-primary-rgb), 0.1); color: var(--ion-color-primary); }
      &.color-orange { background: rgba(var(--ion-color-warning-rgb), 0.1); color: var(--ion-color-warning); }
      &.color-red { background: rgba(var(--ion-color-danger-rgb), 0.1); color: var(--ion-color-danger); }
    }

    .text-content {
      display: flex;
      flex-direction: column;
      padding-top: 6px;
      padding-bottom: 6px;
    }

    .title {
      font-weight: 600;
      font-size: 16px;
      margin-bottom: 2px;
    }

    .subtitle {
      font-size: 12px;
      color: var(--ion-color-medium);
    }
  `]
})
export class QuickActionMenuComponent {
  private popoverCtrl = inject(PopoverController);

  constructor() {
    addIcons({ briefcaseOutline, receiptOutline, alarmOutline, closeOutline });
  }

  select(action: 'matter' | 'expense' | 'deadline') {
    this.popoverCtrl.dismiss({ action });
  }
}