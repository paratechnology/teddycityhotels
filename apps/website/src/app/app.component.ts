import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from "./public/header/header.component";
import { CommonModule } from '@angular/common';
import { FooterComponent } from "./public/footer/footer.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Teddy City Hotel';

  // Navigation links passed to the header component
  navLinks = [
    {
      label: 'About Us',
      isExternal: false,
      dropdown: [
        { label: 'Our Company', href: '/about/company', isExternal: false },
        { label: 'Careers', href: '/about/careers', isExternal: false },
        { label: 'Partners', href: '/about/partners', isExternal: false }
      ]
    },
    { label: 'Rooms & Suites', href: '/rooms', isExternal: false },
    { label: 'Amenities', href: '/amenities', isExternal: false },
    {
      label: 'Deals',
      isExternal: false,
      dropdown: [
        { label: 'Teddycity Deals', href: '/deals/teddycity', isExternal: false },
        { label: 'Group Travel', href: '/deals/group-travel', isExternal: false },
        { label: 'Meetings & Events', href: '/deals/meetings-events', isExternal: false },
        { label: 'Getaway Packages', href: '/deals/packages', isExternal: false }
      ]
    },
    { label: 'Snooker League', href: '/snooker', isExternal: false },
    // { label: 'Swimming', href: '/swimming', isExternal: false }
  ];
}