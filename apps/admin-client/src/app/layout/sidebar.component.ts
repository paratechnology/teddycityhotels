import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AdminModuleKey } from '@teddy-city-hotels/shared-interfaces';
import { AdminSessionService } from '../core/admin-session.service';
import { LayoutStateService } from '../core/layout-state.service';

type NavItem = {
  label: string;
  icon: string;
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
    { label: 'Dashboard',     icon: '📊', link: '/dashboard',     module: 'dashboard' },
    { label: 'Properties',    icon: '🏨', link: '/properties',    module: 'properties' },
    { label: 'Bookings',      icon: '📅', link: '/bookings',      module: 'bookings' },
    { label: 'Rooms',         icon: '🛏️', link: '/rooms',         module: 'rooms' },
    { label: 'Snooker',       icon: '🎱', link: '/snooker',       module: 'snooker' },
    { label: 'Financials',    icon: '💳', link: '/financials',    module: 'financials' },
    { label: 'Revenue',       icon: '📈', link: '/revenue',       module: 'financials' },
    { label: 'Swimming',      icon: '🏊', link: '/swimming',      module: 'financials' },
    { label: 'Menu',          icon: '🍽️', link: '/kitchen',       module: 'kitchen' },
    { label: 'Notifications', icon: '🔔', link: '/notifications', module: 'notifications' },
    { label: 'Admin Users',   icon: '👥', link: '/admins',        module: 'admins', superAdminOnly: true },
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
