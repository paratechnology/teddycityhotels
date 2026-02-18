import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../core/services/material.module';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['../legal-page.scss'] // Using the shared legal page style
})
export class PrivacyPolicyComponent {
  // No logic needed, just displaying static content
}