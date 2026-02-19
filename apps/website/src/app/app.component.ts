import { Component, ViewChild } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { HeaderComponent } from "./public/header/header.component";
import { MatSidenavContainer, MatSidenav, MatSidenavContent } from "@angular/material/sidenav";
import { MatNavList, MatDivider, MatListItem } from "@angular/material/list";
import { CommonModule } from '@angular/common';
import { FooterComponent } from "./public/footer/footer.component";

@Component({
  selector: 'app-root',
  standalone: true, // Make sure AppComponent is standalone
  imports: [
    CommonModule, // Add CommonModule for *ngFor
    RouterOutlet,
    RouterLink,
    HeaderComponent,
    FooterComponent,
    MatSidenavContainer,
    MatSidenav,
    MatNavList,
    MatDivider,
    MatSidenavContent,
    MatListItem // Import MatListItem
    ,
    FooterComponent
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'marketing-site';

  @ViewChild('sidenav') sidenav!: MatSidenav;

  // --- UPDATED NAVLINKS ---
  // Changed hrefs from anchors (#) to router paths (/)
  navLinks = [
    { label: 'Home', href: '/', isExternal: false },
    { label: 'Snooker League', href: '/snooker', isExternal: false },
    { label: 'Swimming', href: '/swimming', isExternal: false },
    { label: 'Book Now', href: '/booking', isExternal: false },
    { label: 'Contact', href: '/contact', isExternal: false }
  ];

  // Function to close sidenav on item click, especially for mobile
  closeSidenav() {
    if (this.sidenav) {
      this.sidenav.close();
    }
  }
}