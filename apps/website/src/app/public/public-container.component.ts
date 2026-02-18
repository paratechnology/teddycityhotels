import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeroComponent } from './hero/hero.component';
import { TestimonialsComponent } from "./testimonials/testimonials.component";
import { AboutSummaryComponent } from "./about-summary/about-summary.component";
import { ContactComponent } from "./contact/contact.component";

// --- REMOVED: Imports for components that are now dedicated pages ---
// import { FeaturesComponent } from './features/features.component';
// import { PricingComponent } from './pricing/pricing.component';
import { FaqComponent } from './faq/faq.component';             

@Component({
  selector: 'app-public-container',
  standalone: true,
  // --- UPDATED: Imports list ---
  imports: [
    RouterModule,
    HeroComponent,
    TestimonialsComponent,
    // FeaturesComponent,  <- REMOVED
    // PricingComponent, <- REMOVED
    FaqComponent,    
    ContactComponent
    ,
    AboutSummaryComponent,
    ContactComponent
],
  // --- UPDATED: Template is now cleaner ---
  template: `
    <main>
      <app-hero></app-hero>
      <app-about-summary></app-about-summary>
      <app-faq></app-faq>
      <app-testimonials></app-testimonials>
      <app-contact></app-contact>
      <!-- 
        You could add short "summary" sections here later,
        e.g., <app-features-summary> with a "Learn More" button
        that links to the /features page.
      -->
    </main>
    `
})
export class PublicContainerComponent {}