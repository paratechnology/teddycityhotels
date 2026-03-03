import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AdminModuleKey } from '@teddy-city-hotels/shared-interfaces';
import { AdminSessionService } from '../core/admin-session.service';
import { LayoutStateService } from '../core/layout-state.service';

type NavItem = {
  label: string;
  link: string;
  module: AdminModuleKey;
  superAdminOnly?: boolean;
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  items: NavItem[] = [
    { label: 'Dashboard', link: '/dashboard', module: 'dashboard' },
    { label: 'Bookings', link: '/bookings', module: 'bookings' },
    { label: 'Rooms', link: '/rooms', module: 'rooms' },
    { label: 'Snooker', link: '/snooker', module: 'snooker' },
    { label: 'Financials', link: '/financials', module: 'financials' },
    { label: 'Revenue', link: '/revenue', module: 'financials' },
    { label: 'Menu', link: '/kitchen', module: 'kitchen' },
    { label: 'Notifications', link: '/notifications', module: 'notifications' },
    { label: 'Admin Users', link: '/admins', module: 'admins', superAdminOnly: true },
  ];

  constructor(public session: AdminSessionService, public layout: LayoutStateService) {}

  onSidebarMouseEnter(): void {
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches;
    if (isMobile || !this.layout.collapsed) {
      return;
    }

    this.layout.setHoverExpanded(true);
  }

  onSidebarMouseLeave(): void {
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches;
    if (isMobile) {
      return;
    }

    if (this.layout.collapsed) {
      this.layout.setHoverExpanded(false);
      return;
    }

    this.layout.setHoverExpanded(false);
    this.layout.setSidebarCollapsed(true);
  }

  canAccess(item: NavItem): boolean {
    const user = this.session.adminUser;
    if (!user) return true;
    if (item.superAdminOnly) return !!user.isSuperAdmin;
    return this.session.hasModuleAccess(item.module);
  }

  itemLabel(item: NavItem): string {
    if (!this.layout.effectiveCollapsed) {
      return item.label;
    }

    return item.label
      .split(' ')
      .map((chunk) => chunk[0] || '')
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
