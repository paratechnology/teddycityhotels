import { Component, OnInit, inject, Output, EventEmitter, computed, signal, Input, HostBinding, effect, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { IonIcon, IonAvatar, IonLabel, IonItem, IonList, IonNote, AlertController, Platform } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  statsChartOutline, logOutOutline, gridOutline, briefcaseOutline, 
  peopleOutline, calendarOutline, walletOutline, cogOutline, 
  chevronBackOutline, chevronForwardOutline, businessOutline, 
  personOutline, libraryOutline, folderOpenOutline, personCircleOutline, 
  menuOutline, alarmOutline, chevronDownOutline, fileTrayFullOutline, 
  receiptOutline, cashOutline, bookOutline, settingsOutline, chevronUpOutline,
  listOutline, homeOutline
} from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { IFirm } from '@quickprolaw/shared-interfaces';
import { FirmService } from '../../../core/services/firm.service';
import { AccessControlService } from '../../../core/services/access-control.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, IonIcon, IonAvatar, IonLabel, IonItem, IonList, IonNote]
})
export class SidebarComponent implements OnInit {
  public authService = inject(AuthService);
  public navigationService = inject(NavigationService);
  public firmService = inject(FirmService);
  public acs = inject(AccessControlService);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private platform = inject(Platform);

  // --- Signals & Computed ---
  userProfile = this.authService.userProfile; 
  firmProfile = signal<IFirm | null>(null);

  // Detect Mobile View dynamically
  isMobile = input(window.innerWidth <= 768);

  // LOGIC FIX: Determine collapsed state based on device type
  @HostBinding('class.collapsed') get collapsed() {
    if (this.isMobile()) {
      // On Mobile: Collapsed means "Menu is Closed"
      // If the service has 'isMobileMenuOpen', use !isMobileMenuOpen()
      // Fallback: If your service only uses one variable, we might need to adjust this.
      return !this.navigationService.isMobileMenuOpen(); 
    } else {
      // On Desktop: Collapsed means "Rail Mode"
      return this.navigationService.isSidebarCollapsed();
    }
  }

  // Bind 'mobile' class for CSS specifics
  @HostBinding('class.mobile') get mobileClass() {
    return this.isMobile();
  }

  @Output() mobileToggleRequested = new EventEmitter<void>();

  // Menu States
  isAccountMenuOpen = signal(true);
  isFirmMenuOpen = signal(true);

  constructor() {
    addIcons({ 
      statsChartOutline, logOutOutline, gridOutline, briefcaseOutline, 
      peopleOutline, calendarOutline, walletOutline, cogOutline, 
      chevronBackOutline, chevronForwardOutline, businessOutline, 
      personOutline, libraryOutline, folderOpenOutline, personCircleOutline, 
      menuOutline, alarmOutline, chevronDownOutline, fileTrayFullOutline, 
      receiptOutline, cashOutline, bookOutline, settingsOutline, chevronUpOutline,
      listOutline, homeOutline
    });
  }

  ngOnInit(): void {
    this.loadFirmData();
  }

  loadFirmData() {
    this.firmService.getProfile().subscribe(profile => {
      this.firmProfile.set(profile);
    });
  }

  expandSidebar(): void {
    if (!this.isMobile()) {
      this.navigationService.openSidebar();
    }
  }

  collapseSidebar(): void {
    if (!this.isMobile()) {
      this.navigationService.closeSidebar();
    }
  }

  toggleAccountMenu() {
    this.isAccountMenuOpen.update(v => !v);
    // Only auto-expand rail on desktop
    if (!this.isMobile() && this.navigationService.isSidebarCollapsed()) {
      this.navigationService.openSidebar();
    }
  }

  toggleFirmMenu() {
    this.isFirmMenuOpen.update(v => !v);
    if (!this.isMobile() && this.navigationService.isSidebarCollapsed()) {
      this.navigationService.openSidebar();
    }
  }

  handleLinkClick(): void {
    if (this.isMobile()) {
      this.navigationService.closeMobileMenu();
      this.mobileToggleRequested.emit();
    }
  }

  async logout(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirm Sign Out',
      message: 'Are you sure you want to sign out?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Sign Out',
          role: 'destructive',
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/login']);
          },
        },
      ],
    });
    await alert.present();
  }
}