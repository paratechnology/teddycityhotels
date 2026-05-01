import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from "./public/header/header.component";
import { CommonModule } from '@angular/common';
import { FooterComponent } from "./public/footer/footer.component";
import { IProperty } from '@teddy-city-hotels/shared-interfaces';
import { PropertyService } from './public/properties/property.service';

interface NavDropdownItem {
  label: string;
  href: string;
}

interface NavLink {
  label: string;
  href?: string;
  isExternal?: boolean;
  dropdown?: NavDropdownItem[];
}

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
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'Teddy City Hotels';

  navLinks: NavLink[] = [
    {
      label: 'Our Hotels',
      dropdown: [{ label: 'All hotels', href: '/hotels' }],
    },
    { label: 'About', href: '/about' },
    { label: 'Become a Teddy City Hotel', href: '/become-a-teddy-city-hotel' },
    { label: 'Contact', href: '/contact' },
  ];

  constructor(private propertyService: PropertyService) {}

  ngOnInit(): void {
    this.propertyService.list().subscribe({
      next: (hotels) => this.populateHotelsDropdown(hotels),
      error: () => { /* dropdown falls back to "All hotels" only */ },
    });
  }

  private populateHotelsDropdown(hotels: IProperty[]): void {
    const dropdown: NavDropdownItem[] = hotels.map((h) => ({
      label: h.branding?.displayName || h.name,
      href: `/hotels/${h.slug}`,
    }));
    dropdown.push({ label: 'All hotels', href: '/hotels' });

    this.navLinks = this.navLinks.map((link) =>
      link.label === 'Our Hotels' ? { ...link, dropdown } : link
    );
  }
}
