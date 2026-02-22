import { Component, HostListener, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  // The navigation links are passed in from the main app component.
  @Input() navLinks: any[] = [];

  // This boolean will be true if the user has scrolled down more than 10 pixels.
  isScrolled = false;

  // This boolean will be true if the mobile menu is open.
  isMobileMenuOpen = false;

  openMobileDropdown: any = null;

  // Listen to the window's scroll event.
  @HostListener('window:scroll')
  onWindowScroll() {
    // Set isScrolled to true if the page is scrolled more than 10px, otherwise false.
    this.isScrolled = window.pageYOffset > 10;
  }

  // Toggle the mobile menu.
  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  // Close the mobile menu.
  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  toggleDropdown(event: MouseEvent) {
    const dropdown = (event.currentTarget as HTMLElement).closest('.dropdown');
    dropdown?.classList.toggle('open');
  }

  isDropdownActive(dropdown: any[]): boolean {
    return dropdown.some(item => this.isLinkActive(item.href));
  }

  private isLinkActive(href: string): boolean {
    return window.location.pathname === href;
  }

  toggleMobileDropdown(event: MouseEvent) {
    const dropdown = (event.currentTarget as HTMLElement).closest('.mobile-dropdown');
    const link = dropdown?.querySelector('a');
    if (this.openMobileDropdown === link) {
      this.openMobileDropdown = null;
    } else {
      this.openMobileDropdown = link;
    }
  }

  isMobileDropdownOpen(link: any): boolean {
    return this.openMobileDropdown === link;
  }

  getMobileDropdownIcon(link: any): string {
    return this.isMobileDropdownOpen(link) ? 'arrow_drop_up' : 'arrow_drop_down';
  }
}
