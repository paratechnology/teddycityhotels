import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { baseURL } from '@quickprolaw/shared-interfaces';
import { Observable, tap } from 'rxjs';

export interface DownloadLinks {
  android?: { apkUrl: string; storeUrl?: string; };
  ios?: { storeUrl: string; };
  windows?: { setupUrl: string; };
  macos?: { dmgUrl: string; };
  linux?: { appImageUrl: string; };
}

@Injectable({
  providedIn: 'root'
})
export class DownloadService {
  private http = inject(HttpClient);
  private appUrl = baseURL + 'app/'; // Corrected to use baseURL from shared interfaces

  public links = signal<DownloadLinks | null>(null);

  getDownloadLinks(): Observable<DownloadLinks> {
    return this.http.get<DownloadLinks>(`${this.appUrl}download-links`).pipe(
      tap(links => this.links.set(links))
    );
  }

  triggerDownload(url: string) {
    window.open(url, '_blank');
  }
}