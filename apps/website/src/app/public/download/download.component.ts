import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../core/services/material.module';
import { DownloadService } from '../../core/services/download.service';

@Component({
  selector: 'app-download',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './download.component.html',
  styleUrls: ['./download.component.scss']
})
export class DownloadComponent implements OnInit {
  public downloadService = inject(DownloadService);
  public links = this.downloadService.links;

  ngOnInit(): void {
    // Fetch the links if they haven't been fetched yet
    if (!this.links()) {
      this.downloadService.getDownloadLinks().subscribe();
    }
  }

  // Mobile Store Clicks
  redirectToGooglePlay() {
    const url = this.links()?.android?.storeUrl;
    if (url) this.downloadService.triggerDownload(url);
  }

  redirectToAppStore() {
    const url = this.links()?.ios?.storeUrl;
    if (url) this.downloadService.triggerDownload(url);
  }

  // Desktop Clicks
  downloadWindows() {
    const url = this.links()?.windows?.setupUrl;
    if (url) this.downloadService.triggerDownload(url);
  }

  downloadMacOS() {
    const url = this.links()?.macos?.dmgUrl;
    if (url) this.downloadService.triggerDownload(url);
  }

  downloadLinux() {
    const url = this.links()?.linux?.appImageUrl;
    if (url) this.downloadService.triggerDownload(url);
  }

  // Android Sideload
  downloadAPK() {
    const url = this.links()?.android?.apkUrl;
    if (url) this.downloadService.triggerDownload(url);
  }
}