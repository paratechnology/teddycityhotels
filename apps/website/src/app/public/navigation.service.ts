import { Injectable } from '@angular/core';

export interface ILink {
  label: string;
  href: string; // Using href for simple anchor links on a single page
}

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  public getHeaderLinks(): ILink[] {
    return [
      { label: 'Home', href: '#hero' },
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Security', href: '#security' },
      { label: 'Contact', href: '#contact' },
    ];
  }
}
