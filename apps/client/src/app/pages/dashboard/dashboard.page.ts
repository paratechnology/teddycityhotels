import { Component, OnInit, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, 
  IonCardHeader, IonCardTitle, IonCardContent, IonSpinner, IonList, IonItem, 
  IonIcon, IonLabel, IonButtons, IonButton, IonBadge, PopoverController 
} from '@ionic/angular/standalone';
import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { NavigationService } from '../../core/services/navigation.service';
import { IFirmUser } from '@quickprolaw/shared-interfaces';
import { addIcons } from 'ionicons';
import { 
  notificationsOutline, listOutline, warningOutline, calendarOutline, 
  documentTextOutline, logInOutline, logOutOutline, briefcaseOutline, 
  checkboxOutline, sunnyOutline, notificationsOffOutline, menuOutline, 
  searchOutline, alertCircleOutline 
} from 'ionicons/icons';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationsPopoverComponent } from '../../shared/components/notifications-popover/notifications-popover.component';

// === IMPORT TOUR SERVICE ===
import { TourService } from '../../core/services/tour.service';
import { DriveStep } from 'driver.js';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    IonButton, CommonModule, RouterLink, IonHeader, IonToolbar, IonContent, 
    IonBadge, IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
    IonSpinner, IonList, IonItem, IonIcon, IonLabel, IonButtons, IonTitle
  ],
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  public dashboardService = inject(DashboardService);
  public notificationService = inject(NotificationService);
  private popoverCtrl = inject(PopoverController);
  private authService = inject(AuthService);
  public navigationService = inject(NavigationService);
  private tourService = inject(TourService); // <--- Inject TourService

  public dashboardData = this.dashboardService.data;
  public loading = this.dashboardService.loading;
  public user = this.authService.userProfile;
  public isAdmin = computed(() => this.user()?.admin || false);

  constructor() {
    addIcons({ 
      alertCircleOutline, notificationsOutline, listOutline, warningOutline, 
      calendarOutline, documentTextOutline, logInOutline, logOutOutline, 
      briefcaseOutline, checkboxOutline, sunnyOutline, notificationsOffOutline, 
      menuOutline, searchOutline
    });


    effect(() => {
      const isLoading = this.loading();
      const hasData = this.dashboardData();
      
      // If loading is done AND we have data, we are ready to tour
      if (!isLoading && hasData) {
        // Add a tiny delay for the browser paint cycle
        setTimeout(() => {
          this.startDashboardTour();
        }, 500); 
      }
    });
    
  }

  ngOnInit(): void {
    const user: IFirmUser | null = this.user();
    if (!user) return;
    this.dashboardService.loadDashboardData(user);
  }


private startDashboardTour() {
    const steps: DriveStep[] = [
       // ... your steps array ...
       // (Ensure IDs like #dashboard-kpi-section match your HTML)
       { 
        popover: { 
          title: 'Welcome to QuickProLaw', 
          description: 'Let`s get you oriented. We will start with the main navigation.' 
        } 
      },
      { 
        element: '#dashboard-menu-btn', 
        popover: { 
          title: 'Main Menu', 
          description: 'Access Firm Settings, Financial Reports, and File Room here.' 
        } 
      },
      { 
        element: '#app-tab-bar', 
        popover: { 
          title: 'Navigation Tabs', 
          description: 'Quickly switch between Matters, Tasks, and Calendar here.' 
        } 
      },
      { 
        element: '#app-quick-action-fab', 
        popover: { 
          title: 'Quick Actions', 
          description: 'Click (+) anywhere to instantly create a Matter, Expense, or Deadline.' 
        } 
      },
      { 
        element: '#dashboard-kpi-section', 
        popover: { 
          title: 'Pulse Check', 
          description: 'Monitor your overdue tasks and active cases at a glance.' 
        } 
      },
      { 
        element: '#dashboard-notif-btn', 
        popover: { 
          title: 'Stay Updated', 
          description: 'Alerts for new assignments, document approvals, and court dates appear here.' 
        } 
      }
    ];

    this.tourService.startTour('dashboard_v1', steps);
  }

  navigateTo(link: string): void {
    if (link) {
      this.router.navigateByUrl(link);
    }
  }

  async showNotifications(event: Event) {
    const popover = await this.popoverCtrl.create({
      component: NotificationsPopoverComponent,
      event: event,
      translucent: true,
    });
    await popover.present();
  }
}