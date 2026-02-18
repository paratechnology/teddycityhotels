import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../core/services/material.module';

@Component({
  selector: 'app-terms-of-service',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './terms-of-service.component.html',
  styleUrls: ['../legal-page.scss'] // Using the shared legal page style
})
export class TermsOfServiceComponent {
  // No logic needed, just displaying static content
}