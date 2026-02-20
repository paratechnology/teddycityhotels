import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { HeroComponent } from './hero/hero.component';
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
    FaqComponent,    
    ContactComponent,
    AboutSummaryComponent
  ],
  template: `
    <main>
      <app-hero></app-hero>
      <app-about-summary></app-about-summary>

      <!-- Snooker Summary -->
      <section class="summary-section snooker-summary">
        <span class="section-bg-text">LEAGUE</span>
        <div class="content-wrapper">
          <h2>The Gentlemen's Game</h2>
          <div class="divider"></div>
          <p>
            Join the most exciting snooker competition in town. Our league mimics the thrill of professional tournaments,
            complete with group stages and intense knockout rounds. Prove your skill on the baize.
          </p>
          <a mat-raised-button color="accent" class="btn-luxury" routerLink="/snooker">Join the League</a>
        </div>
      </section>

      <!-- Swimming Summary -->
      <section class="summary-section swimming-summary">
        <span class="section-bg-text">OASIS</span>
        <div class="content-wrapper">
          <h2>Dive into Serenity</h2>
          <div class="divider"></div>
          <p>
            Escape to our pristine aquatic center. Whether you're looking to refine your stroke with private lessons
            or simply float your cares away, our world-class pool offers a refreshing retreat.
          </p>
          <a mat-stroked-button color="primary" class="btn-luxury-outline" routerLink="/swimming">Explore the Pool</a>
        </div>
      </section>

      <app-faq></app-faq>
      <app-contact></app-contact>
    </main>
    `
})
export class PublicContainerComponent {}