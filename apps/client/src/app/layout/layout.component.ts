import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonIcon,
  PopoverController,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonLabel,
  IonFabButton,
  IonFab,
  IonRouterOutlet
} from '@ionic/angular/standalone';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { AccessControlService } from '../core/services/access-control.service';
import { addIcons } from 'ionicons';
import {
  listOutline,
  menuOutline,
  notificationsOutline,
  personCircleOutline,
  searchOutline,
  gridOutline,
  calendarOutline,
  folderOpenOutline,
  add,
} from 'ionicons/icons';

import { MatterFormComponent } from '../pages/matters/components/matter-form/matter-form.component';
import { ExpenseFormComponent } from '../pages/matters/components/expense-form/expense-form.component';
import { DeadlineFormComponent } from '../pages/matters/components/deadline-form/deadline-form.component';
import { NavigationService } from '../core/services/navigation.service';
import { NotificationsPopoverComponent } from '../shared/components/notifications-popover/notifications-popover.component';
import { GlobalSearchPopoverComponent } from '../shared/components/global-search-popover/global-search-popover.component';
import { ModalController } from '@ionic/angular/standalone';
import { QuickActionMenuComponent } from './components/quick-action-menu/quick-action-menu.component';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  standalone: true,
  imports: [
    IonLabel,
    IonTabButton,
    IonTabBar,
    IonFabButton,
    IonFab,
    IonTabs,
    CommonModule,
    SidebarComponent,
    IonIcon,
    IonRouterOutlet
  ],
})
export class LayoutComponent {
  public navigationService = inject(NavigationService);
  private breakpointObserver = inject(BreakpointObserver);
  private acs = inject(AccessControlService);
  private popoverCtrl = inject(PopoverController);
  private modalCtrl = inject(ModalController);
  // isMobile is a Signal<boolean>, not an Observable
  public isMobile = toSignal(
    this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small])
      .pipe(map((result) => result.matches)),
    { initialValue: false }
  );

  public isSidebarCollapsed = computed(
    () => !this.navigationService.isSidebarOpen()
  );

  public isMobileMenuOpen = computed(
    () => this.isMobile() && this.navigationService.isSidebarOpen()
  );

  public tabLinks = computed(() => {
    return this.navigationService.getLinks().filter((link) => {
      if (!link.isTab) return false;

      if (link.role === 'all' || !link.role) return true;
      if (link.role === 'admin') return this.acs.isAdmin();
      if (link.role === 'fileManager') return this.acs.isFileManager();

      return true;
    });
  });

  constructor() {
    addIcons({
      menuOutline,
      notificationsOutline,
      searchOutline,
      listOutline,
      add,
      gridOutline,
      calendarOutline,
      folderOpenOutline,
      personCircleOutline,
    });
  }

  async showNotifications(event: Event) {
    const popover = await this.popoverCtrl.create({
      component: NotificationsPopoverComponent,
      event: event,
      translucent: true,
    });
    await popover.present();
  }

  async showSearch(event: Event) {
    const popover = await this.popoverCtrl.create({
      component: GlobalSearchPopoverComponent,
      event: event,
      translucent: true,
      size: 'auto',
      side: 'bottom',
      alignment: 'center',
    });
    await popover.present();
  }

  /**
   * Shows the Custom Quick Action Menu
   */
  async presentQuickActions(event: Event) {
    const popover = await this.popoverCtrl.create({
      component: QuickActionMenuComponent,
      event: event, // This anchors the menu to the button that was clicked
      alignment: 'center', // Centers it relative to the button
      side: 'top', // Makes it appear ABOVE the button
      arrow: false, // Removes the little triangle for a cleaner look
      dismissOnSelect: true,
      cssClass: 'quick-action-popover', // We will style this next
      enterAnimation: undefined, // Uses default iOS/Material animation which is good
    });

    await popover.present();

    const { data } = await popover.onDidDismiss();
    if (data && data.action) {
      this.openQuickAction(data.action);
    }
  }

  /**
   * Opens the specific form modal
   */
  async openQuickAction(type: 'matter' | 'expense' | 'deadline') {
    let component;

    // Select component based on type
    switch (type) {
      case 'matter':
        component = MatterFormComponent;
        break;
      case 'expense':
        component = ExpenseFormComponent;
        break;
      case 'deadline':
        component = DeadlineFormComponent;
        break;
    }

    const modal = await this.modalCtrl.create({
      component: component,
      // '0.9' means it takes up 90% of the screen height (Sheet Modal)
      breakpoints: [0, 0.9, 1],
      initialBreakpoint: 0.9,
      handle: true,
    });

    await modal.present();
  }
}
