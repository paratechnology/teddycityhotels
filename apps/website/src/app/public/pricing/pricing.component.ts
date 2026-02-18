import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../core/services/material.module';
import { RouterModule } from '@angular/router'; // <-- ADD THIS IMPORT

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [
    CommonModule, 
    MaterialModule,
    RouterModule // <-- ADD THIS TO IMPORTS
  ],
  templateUrl: './pricing.component.html',
  styleUrls: ['./pricing.component.scss']
})
export class PricingComponent {

  // The selectPlan() method is no longer needed if the buttons
  // just link to the download page. You can remove it.
  // selectPlan(plan: string) {
  // }
}