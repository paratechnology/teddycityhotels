import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="state">
      <h2>Forbidden</h2>
      <p>Your admin account does not have access to this module.</p>
    </section>
  `,
  styles: [
    `
      .state {
        margin: 2rem auto;
        max-width: 560px;
        border: 1px solid #d9e1e8;
        border-radius: 12px;
        padding: 1.2rem;
        background: #fff;
      }
    `,
  ],
})
export class ForbiddenComponent {}
