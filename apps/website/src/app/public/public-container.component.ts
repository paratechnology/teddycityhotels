import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { HeroComponent } from './hero/hero.component';
import { AboutSummaryComponent } from "./about-summary/about-summary.component";

@Component({
  selector: 'app-public-container',
  standalone: true,
  imports: [
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    HeroComponent,
    AboutSummaryComponent
  ],
  templateUrl: './public-container.component.html',
  styleUrls: ['./public-container.component.scss']
})
export class PublicContainerComponent {}