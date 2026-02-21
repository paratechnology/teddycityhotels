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

  // Listen to the window's scroll event.
  @HostListener('window:scroll')
  onWindowScroll() {
    // Set isScrolled to true if the page is scrolled more than 10px, otherwise false.
    this.isScrolled = window.pageYOffset > 10;
  }
}
