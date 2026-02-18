import { Component } from '@angular/core';
import { MaterialModule } from '../../core/services/material.module';
import { RouterModule } from '@angular/router'; // Import RouterModule

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [MaterialModule, RouterModule], // Add RouterModule
  templateUrl: './footer.component.html', // Use templateUrl
  styleUrls: ['./footer.component.scss']  // Use styleUrls
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}