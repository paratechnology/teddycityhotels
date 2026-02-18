import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { IFirmUser } from '@quickprolaw/shared-interfaces';

/**
 * A centralized service for handling role-based access control (RBAC) throughout the application.
 * This service provides a single source of truth for user permissions.
 */
@Injectable({
  providedIn: 'root'
})
export class AccessControlService {
  private authService = inject(AuthService);

  private roles = computed(() => this.authService.userProfile()?.roles);
  private isAdminUser = computed(() => this.authService.userProfile()?.admin);
  private isSuperAdminUser = computed(() => this.authService.userProfile()?.isSuperAdmin);

  // --- General Permissions ---
  public isAdmin = computed(() => this.isAdminUser() === true);
  public isSuperAdmin = computed(() => this.isAdminUser() === true);

  // --- Role-Specific Permissions ---
  public canBill = computed(() => this.roles()?.canBill === true || this.isSuperAdminUser());
  public canManageMatter = computed(() => this.roles()?.canMatter === true || this.isSuperAdminUser());
  public canSchedule = computed(() => this.roles()?.canSchedule === true || this.isSuperAdminUser());
  public canAssign = computed(() => this.roles()?.canAssign === true || this.isSuperAdminUser());
  public isFileManager = computed(() => this.roles()?.fileManager === true);
  public isLibrarian = computed(() => this.roles()?.librarian === true);

  /**
   * A generic method to check for a specific role if needed, though using the
   * computed signals is preferred for clarity.
   */
  public hasRole(role: keyof IFirmUser['roles']): boolean {
    return this.roles()?.[role] === true || this.isAdmin();
  }
}