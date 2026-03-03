import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AdminModuleKey, IAdminUser, baseURL } from '@teddy-city-hotels/shared-interfaces';

@Injectable({ providedIn: 'root' })
export class AdminSessionService {
  private tokenKey = 'token';
  private storageKey = 'admin_profile';
  private adminUserSubject = new BehaviorSubject<IAdminUser | null>(this.readCachedUser());

  adminUser$ = this.adminUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  get token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  get adminUser(): IAdminUser | null {
    return this.adminUserSubject.value;
  }

  refreshProfile() {
    return this.http.get<IAdminUser>(`${baseURL}admin/users/me`).pipe(
      tap((user) => {
        this.adminUserSubject.next(user);
        localStorage.setItem(this.storageKey, JSON.stringify(user));
      })
    );
  }

  hasModuleAccess(module: AdminModuleKey): boolean {
    const user = this.adminUser;

    if (!user) {
      // Allow legacy tokens without profile bootstrap.
      return true;
    }

    if (user.isSuperAdmin) {
      return true;
    }

    const access = user.adminAccess;
    if (!access) {
      return true;
    }

    return !!access[module];
  }

  clearSession() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.storageKey);
    this.adminUserSubject.next(null);
  }

  private readCachedUser(): IAdminUser | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as IAdminUser;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }
}
