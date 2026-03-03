import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { InAppAlertService, InAppAlert } from '../../core/in-app-alert.service';

@Component({
  selector: 'app-in-app-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './in-app-alerts.component.html',
  styleUrls: ['./in-app-alerts.component.scss'],
})
export class InAppAlertsComponent {
  constructor(public alertsService: InAppAlertService, private router: Router) {}

  open(alert: InAppAlert): void {
    this.alertsService.dismiss(alert.id);
    if (alert.link) {
      this.router.navigateByUrl(alert.link);
    }
  }

  dismiss(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.alertsService.dismiss(id);
  }
}
