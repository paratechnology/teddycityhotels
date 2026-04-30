import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { IProperty } from '@teddy-city-hotels/shared-interfaces';
import { PropertyContextService } from '../property-context.service';

@Component({
  selector: 'app-property-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './property-home.component.html',
  styleUrls: ['./property-home.component.scss'],
})
export class PropertyHomeComponent implements OnInit, OnDestroy {
  property: IProperty | null = null;
  private sub?: Subscription;

  constructor(private route: ActivatedRoute, private context: PropertyContextService) {}

  ngOnInit(): void {
    const initial = (this.route.parent?.snapshot.data['property'] as IProperty | null) ?? null;
    if (initial) this.context.setActive(initial);
    this.sub = this.context.active$.subscribe((p) => (this.property = p));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  fallbackHero(): string {
    return 'assets/img/hero-poster.webp';
  }

  hasGeo(): boolean {
    return !!this.property?.geo?.lat && !!this.property?.geo?.lng;
  }

  mapEmbedSrc(): string | null {
    if (!this.hasGeo()) return null;
    const lat = this.property!.geo!.lat;
    const lng = this.property!.geo!.lng;
    return `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
  }

  directionsHref(): string | null {
    if (!this.hasGeo()) return null;
    return `https://maps.google.com/?q=${this.property!.geo!.lat},${this.property!.geo!.lng}`;
  }
}
