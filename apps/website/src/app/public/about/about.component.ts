import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IProperty } from '@teddy-city-hotels/shared-interfaces';
import { PropertyService } from '../properties/property.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
})
export class AboutComponent implements OnInit {
  properties: IProperty[] = [];

  constructor(private propertyService: PropertyService) {}

  ngOnInit(): void {
    this.propertyService.list().subscribe({
      next: (properties) => (this.properties = properties),
      error: () => { /* silent — page still renders without the portfolio strip */ },
    });
  }
}
