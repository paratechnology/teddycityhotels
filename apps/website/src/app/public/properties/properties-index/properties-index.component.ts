import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IProperty } from '@teddy-city-hotels/shared-interfaces';
import { PropertyService } from '../property.service';

@Component({
  selector: 'app-properties-index',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './properties-index.component.html',
  styleUrls: ['./properties-index.component.scss'],
})
export class PropertiesIndexComponent implements OnInit {
  properties: IProperty[] = [];
  loading = false;
  error = '';

  constructor(private service: PropertyService) {}

  ngOnInit(): void {
    this.loading = true;
    this.service.list().subscribe({
      next: (properties) => {
        this.properties = properties;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load properties.';
        this.loading = false;
      },
    });
  }
}
