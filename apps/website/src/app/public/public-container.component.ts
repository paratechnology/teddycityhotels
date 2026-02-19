import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { HeroComponent } from './hero/hero.component';
import { TestimonialsComponent } from "./testimonials/testimonials.component";
import { AboutSummaryComponent } from "./about-summary/about-summary.component";
import { ContactComponent } from "./contact/contact.component";
import { FaqComponent } from './faq/faq.component';             

@Component({
  selector: 'app-public-container',
  standalone: true,
  imports: [
    RouterModule,
    MatButtonModule,
    HeroComponent,
    TestimonialsComponent,
    FaqComponent,    
    ContactComponent,
    AboutSummaryComponent
  ],
  template: `
    <main>
      <app-hero></app-hero>
      <app-about-summary></app-about-summary>

      <!-- Snooker Summary -->
      <section class="summary-section snooker-summary" style="padding: 60px 20px; text-align: center; background-color: #f5f5f5;">
        <div class="container" style="max-width: 800px; margin: 0 auto;">
          <h2 style="font-size: 2.5rem; margin-bottom: 20px;">Teddy City Snooker League</h2>
          <p style="font-size: 1.2rem; color: #666; margin-bottom: 30px;">
            Join the most exciting snooker competition in town. Structured like a football tournament with groups and knockouts.
          </p>
          <a mat-raised-button color="accent" routerLink="/snooker">Join the League</a>
        </div>
      </section>

      <!-- Swimming Summary -->
      <section class="summary-section swimming-summary" style="padding: 60px 20px; text-align: center; background-color: #fff;">
        <div class="container" style="max-width: 800px; margin: 0 auto;">
          <h2 style="font-size: 2.5rem; margin-bottom: 20px;">Dive into Luxury</h2>
          <p style="font-size: 1.2rem; color: #666; margin-bottom: 30px;">
            Enjoy our world-class swimming facilities. Memberships, lessons, and bookings available.
          </p>
          <a mat-raised-button color="primary" routerLink="/swimming">Explore Pool</a>
        </div>
      </section>

      <app-testimonials></app-testimonials>
      <app-faq></app-faq>
      <app-contact></app-contact>
    </main>
    `
})
export class PublicContainerComponent {}