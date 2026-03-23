import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="not-found">
      <span class="error-code">404</span>
      <h1>Page Not Found</h1>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <div class="actions">
        <a routerLink="/" class="btn btn-primary">Back to Home</a>
        <a routerLink="/rooms" class="btn btn-outline">Browse Rooms</a>
      </div>
    </div>
  `,
  styles: [`
    @use '../../../theme/variables' as theme;

    :host {
      display: block;
      background-color: theme.$theme-background;
      min-height: 100vh;
    }

    .not-found {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
      text-align: center;
    }

    .error-code {
      font-family: theme.$font-family-serif;
      font-size: clamp(6rem, 15vw, 12rem);
      font-weight: 700;
      color: rgba(theme.$theme-secondary, 0.15);
      line-height: 1;
      margin-bottom: -1rem;
    }

    h1 {
      font-family: theme.$font-family-serif;
      font-size: clamp(2rem, 4vw, 3rem);
      color: theme.$theme-primary;
      margin: 0 0 1rem;
    }

    p {
      font-family: theme.$font-family-sans;
      font-size: 1.1rem;
      color: rgba(255, 255, 255, 0.5);
      margin: 0 0 2.5rem;
      max-width: 420px;
    }

    .actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      justify-content: center;
    }

    .btn {
      padding: 0.85rem 2rem;
      border-radius: 50px;
      font-weight: 700;
      font-size: 0.85rem;
      letter-spacing: 1px;
      text-transform: uppercase;
      text-decoration: none;
      transition: all 0.25s ease;
    }

    .btn-primary {
      background: theme.$theme-secondary;
      color: #0d1b2a;
      border: 2px solid theme.$theme-secondary;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(197, 160, 89, 0.35);
      }
    }

    .btn-outline {
      background: transparent;
      color: rgba(255, 255, 255, 0.7);
      border: 2px solid rgba(255, 255, 255, 0.2);

      &:hover {
        border-color: rgba(255, 255, 255, 0.5);
        color: #fff;
      }
    }
  `]
})
export class NotFoundComponent {}
