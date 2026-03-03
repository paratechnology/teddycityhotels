import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AdminSessionService } from '../core/admin-session.service';
import { LayoutStateService } from '../core/layout-state.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  constructor(
    public session: AdminSessionService,
    public layout: LayoutStateService,
    private router: Router
  ) {}

  get userLabel(): string {
    const user = this.session.adminUser;
    if (!user) return 'Admin';
    return user.fullname || user.email || 'Admin';
  }

  get userInitials(): string {
    const label = this.userLabel.trim();
    const chunks = label.split(/\s+/).filter(Boolean);
    if (!chunks.length) return 'A';
    if (chunks.length === 1) return chunks[0].slice(0, 2).toUpperCase();
    return `${chunks[0][0]}${chunks[1][0]}`.toUpperCase();
  }

  logout(): void {
    this.session.clearSession();
    this.router.navigate(['/login']);
  }
}
