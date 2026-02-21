import { Injectable, signal, inject } from '@angular/core';
import { IFirmUser } from '@teddy-city-hotels/shared-interfaces';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

export interface INavLink {
  path: string;
  label: string;
  icon: string;
  role?: keyof IFirmUser['roles'] | 'admin' | 'superAdmin'| 'all' | 'any';
  permission?: string; 
  isTab?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  // State Signals
  public isMobileMenuOpen = signal(false);
  public isSidebarCollapsed = signal(true); // Default to collapsed on load

  private breakpointObserver = inject(BreakpointObserver);

  constructor() {
    // Automatically manage state based on screen size
    this.breakpointObserver.observe([Breakpoints.XSmall, Breakpoints.Small])
      .subscribe(result => {
        if (result.matches) {
          // Mobile: Sidebar hidden, Menu closed
          this.isSidebarCollapsed.set(true); 
          this.isMobileMenuOpen.set(false);
        } else {
          // Desktop: Sidebar rail (collapsed) by default, Menu closed
          this.isSidebarCollapsed.set(true);
          this.isMobileMenuOpen.set(false);
        }
      });
  }

  // === PRIMARY ACTION ===
  public toggleSidebar(): void {
    const isMobile = this.breakpointObserver.isMatched([Breakpoints.XSmall, Breakpoints.Small]);
    
    if (isMobile) {
      // On Mobile: Toggle the Overlay Menu
      this.isMobileMenuOpen.update(v => !v);
    } else {
      // On Desktop: Toggle the Rail expansion
      this.isSidebarCollapsed.update(v => !v);
    }
  }

  // === ALIASES (Fixes your Error) ===
  // These ensure that old HTML buttons calling specific methods still work
  public toggleMobileMenu(): void {
    this.toggleSidebar();
  }

  public openSidebar(): void {
    this.isSidebarCollapsed.set(false);
  }

  public closeSidebar(): void {
    this.isSidebarCollapsed.set(true);
  }

  public closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  // === LINK CONFIGURATION ===
  private links: INavLink[] = [
    {
      path: '/app/dashboard',
      label: 'Home',
      icon: 'grid-outline',
      role: 'all',
      isTab: true,
    },
    {
      path: '/app/matters',
      label: 'Matters',
      icon: 'briefcase-outline',
      role: 'all',
      isTab: true,
    },
    {
      path: '/app/tasks',
      label: 'Tasks',
      icon: 'list-outline',
      role: 'all',
      isTab: true,
    },
    {
      path: '/app/calendar',
      label: 'Calendar',
      icon: 'calendar-outline',
      role: 'all',
      isTab: true,
    },
    {
      path: '/app/attendance',
      label: 'Clock In',
      icon: 'alarm-outline',
      role: 'all',
      isTab: false,
    },
  ];

  getLinks(): INavLink[] {
    return this.links;
  }
  
  // Helper for templates checking state
  public isSidebarOpen(): boolean {
    return !this.isSidebarCollapsed();
  }
}