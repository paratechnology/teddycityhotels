import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Output() toggleSidenav = new EventEmitter<void>();
  @Input() navLinks: any[] = [];

  private lastScroll = 0;
  isHeaderHidden = false;
  isScrolled = false; // Added to track scroll state for styling

  @HostListener('window:scroll')
  onWindowScroll() {
    const currentScroll = window.pageYOffset;

    // Determine if page is scrolled
    this.isScrolled = currentScroll > 50;

    if (currentScroll <= 0) {
      this.isHeaderHidden = false;
      return;
    }

    if (currentScroll > this.lastScroll && currentScroll > 100) {
      this.isHeaderHidden = true;
    } else {
      this.isHeaderHidden = false;
    }

    this.lastScroll = currentScroll;
  }
}
