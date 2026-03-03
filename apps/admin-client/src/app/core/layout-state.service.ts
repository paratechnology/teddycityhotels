import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LayoutStateService {
  private storageKey = 'admin_sidebar_collapsed';
  private collapsedSubject = new BehaviorSubject<boolean>(this.readInitialState());
  private hoverExpandedSubject = new BehaviorSubject<boolean>(false);

  collapsed$ = this.collapsedSubject.asObservable();
  hoverExpanded$ = this.hoverExpandedSubject.asObservable();

  get collapsed(): boolean {
    return this.collapsedSubject.value;
  }

  get hoverExpanded(): boolean {
    return this.hoverExpandedSubject.value;
  }

  get effectiveCollapsed(): boolean {
    if (!this.collapsedSubject.value) {
      return false;
    }

    if (this.isMobile()) {
      return false;
    }

    return !this.hoverExpandedSubject.value;
  }

  toggleSidebar(): void {
    this.setSidebarCollapsed(!this.collapsedSubject.value);
  }

  setSidebarCollapsed(collapsed: boolean): void {
    this.collapsedSubject.next(collapsed);
    if (!collapsed) {
      this.hoverExpandedSubject.next(false);
    }
    localStorage.setItem(this.storageKey, collapsed ? '1' : '0');
  }

  setHoverExpanded(expanded: boolean): void {
    if (this.isMobile()) {
      this.hoverExpandedSubject.next(false);
      return;
    }
    this.hoverExpandedSubject.next(expanded);
  }

  private readInitialState(): boolean {
    const raw = localStorage.getItem(this.storageKey);
    return raw === '1';
  }

  private isMobile(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches;
  }
}
