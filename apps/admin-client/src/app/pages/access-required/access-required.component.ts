import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-access-required',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="state">
      <h2>Access Required</h2>
      <p>A valid admin token is required to open this panel.</p>
      <p>Sign in through your auth flow, then retry.</p>
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
export class AccessRequiredComponent {}
