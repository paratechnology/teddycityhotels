import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface InAppAlert {
  id: string;
  title: string;
  message: string;
  link?: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class InAppAlertService {
  private alertsSubject = new BehaviorSubject<InAppAlert[]>([]);
  alerts$ = this.alertsSubject.asObservable();

  show(alert: Omit<InAppAlert, 'id' | 'createdAt'>): void {
    const next: InAppAlert = {
      id: this.generateId(),
      title: alert.title,
      message: alert.message,
      link: alert.link,
      createdAt: new Date().toISOString(),
    };

    this.alertsSubject.next([next, ...this.alertsSubject.value].slice(0, 6));

    setTimeout(() => this.dismiss(next.id), 9000);
  }

  dismiss(id: string): void {
    this.alertsSubject.next(this.alertsSubject.value.filter((alert) => alert.id !== id));
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}
