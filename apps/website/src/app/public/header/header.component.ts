import { Component, EventEmitter, HostListener, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, MatToolbarModule, MatButtonModule, MatIconModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Output() toggleSidenav = new EventEmitter<void>();
  @Input() navLinks: any[] = [];


  private lastScroll = 0;
  isHeaderHidden = false;

  @HostListener('window:scroll')
  onWindowScroll() {
    const currentScroll = window.pageYOffset;

    // Show header if we are at the top of the page
    if (currentScroll <= 0) {
      this.isHeaderHidden = false;
      return;
    }

    // Hide header on scroll down, show on scroll up
    if (currentScroll > this.lastScroll) {
      this.isHeaderHidden = true; // Scrolling down
    } else {
      this.isHeaderHidden = false; // Scrolling up
    }

    this.lastScroll = currentScroll;
  }
}