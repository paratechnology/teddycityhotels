import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IProperty } from '@teddy-city-hotels/shared-interfaces';
import { PropertyService } from './properties/property.service';

@Component({
  selector: 'app-public-container',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './public-container.component.html',
  styleUrls: ['./public-container.component.scss'],
})
export class PublicContainerComponent implements OnInit {
  properties: IProperty[] = [];
  loading = false;
  error = '';

  constructor(private propertyService: PropertyService) {}

  ngOnInit(): void {
    this.loading = true;
    this.propertyService.list().subscribe({
      next: (properties) => {
        this.properties = properties;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
