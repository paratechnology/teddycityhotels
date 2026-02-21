import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { HeroComponent } from './hero/hero.component';
import { AboutSummaryComponent } from "./about-summary/about-summary.component";

@Component({
  selector: 'app-public-container',
  standalone: true,
  imports: [
    RouterModule,
    MatButtonModule,
    HeroComponent,
    AboutSummaryComponent
  ],
  templateUrl: './public-container.component.html',
  styleUrls: ['./public-container.component.scss']
})
export class PublicContainerComponent {}