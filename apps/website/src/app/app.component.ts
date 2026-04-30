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
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Teddy City Hotels';

  navLinks: NavLink[] = [
    {
      label: 'Our Properties',
      dropdown: [{ label: 'All properties', href: '/properties' }],
    },
    { label: 'About', href: '/about' },
    { label: 'Hotel Management', href: '/management' },
    { label: 'Contact', href: '/contact' },
  ];

  constructor(private propertyService: PropertyService) {}

  ngOnInit(): void {
    this.propertyService.list().subscribe({
      next: (properties) => this.populatePropertiesDropdown(properties),
      error: () => { /* dropdown falls back to "All properties" only */ },
    });
  }

  private populatePropertiesDropdown(properties: IProperty[]): void {
    const dropdown: NavDropdownItem[] = properties.map((p) => ({
      label: p.branding?.displayName || p.name,
      href: `/properties/${p.slug}`,
    }));
    dropdown.push({ label: 'All properties', href: '/properties' });

    this.navLinks = this.navLinks.map((link) =>
      link.label === 'Our Properties' ? { ...link, dropdown } : link
    );
  }
}
