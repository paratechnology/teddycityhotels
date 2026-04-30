import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../core/services/material.module';
import { RouterModule } from '@angular/router';
import { IProperty } from '@teddy-city-hotels/shared-interfaces';
import { PropertyService } from '../properties/property.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, MaterialModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {
  currentYear = new Date().getFullYear();
  properties: IProperty[] = [];

  constructor(private propertyService: PropertyService) {}

  ngOnInit(): void {
    this.propertyService.list().subscribe({
      next: (properties) => (this.properties = properties),
      error: () => { /* footer just hides the column */ },
    });
  }
}
