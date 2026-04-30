import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IProperty } from '@teddy-city-hotels/shared-interfaces';
import { PropertyService } from '../../services/property.service';

@Component({
  selector: 'app-properties',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './properties.component.html',
  styleUrls: ['./properties.component.scss'],
})
export class PropertiesComponent implements OnInit {
  properties: IProperty[] = [];
  loading = false;
  error = '';

  constructor(private propertyService: PropertyService) {}

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    this.loading = true;
    this.error = '';

    this.propertyService.listAll().subscribe({
      next: (properties) => {
        this.properties = properties;
        this.loading = false;
      },
      error: (error) => {
        this.error = error?.error?.message || 'Failed to load properties.';
        this.loading = false;
      },
    });
  }

  deleteProperty(property: IProperty): void {
    if (!confirm(`Delete property "${property.name}"? This cannot be undone.`)) {
      return;
    }

    this.propertyService.delete(property.id).subscribe({
      next: () => this.loadProperties(),
      error: (error) => {
        this.error = error?.error?.message || 'Failed to delete property.';
      },
    });
  }

  statusClass(status: IProperty['status']): string {
    switch (status) {
      case 'active':
        return 'badge-success';
      case 'draft':
        return 'badge-warning';
      case 'archived':
      default:
        return 'badge-danger';
    }
  }
}
