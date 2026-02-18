import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../core/services/material.module';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-about-summary',
  standalone: true,
  imports: [CommonModule, MaterialModule, RouterModule],
  templateUrl: './about-summary.component.html',
  styleUrls: ['./about-summary.component.scss']
})
export class AboutSummaryComponent {

}