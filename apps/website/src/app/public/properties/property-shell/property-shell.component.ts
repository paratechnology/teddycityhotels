import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { IProperty } from '@teddy-city-hotels/shared-interfaces';
import { PropertyContextService } from '../property-context.service';

interface PropertySubNavItem {
  label: string;
  path: string;
  /** Feature flag key on IProperty['features']; if false the link is hidden. */
  feature?: keyof IProperty['features'];
}

@Component({
  selector: 'app-property-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './property-shell.component.html',
  styleUrls: ['./property-shell.component.scss'],
})
export class PropertyShellComponent implements OnInit, OnDestroy {
  property: IProperty | null = null;
  private sub?: Subscription;

  readonly navItems: PropertySubNavItem[] = [
    { label: 'Overview', path: '.' },
    { label: 'Rooms', path: 'rooms', feature: 'rooms' },
    { label: 'Kitchen', path: 'menu', feature: 'kitchen' },
    { label: 'Snooker', path: 'snooker', feature: 'snooker' },
    { label: 'Swimming', path: 'swimming', feature: 'swimming' },
    { label: 'Contact', path: 'contact' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private context: PropertyContextService
  ) {}

  ngOnInit(): void {
    const initial = (this.route.snapshot.data['property'] as IProperty | null) ?? null;
    if (initial) this.context.setActive(initial);

    this.sub = this.context.active$.subscribe((p) => (this.property = p));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.context.setActive(null);
  }

  isVisible(item: PropertySubNavItem): boolean {
    if (!item.feature) return true;
    return !!this.property?.features?.[item.feature];
  }

  bookHref(): string[] {
    return this.property ? ['/properties', this.property.slug, 'rooms'] : ['/properties'];
  }
}
