import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { baseURL } from '@quickprolaw/shared-interfaces';

@Component({
  selector: 'app-verification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verification.component.html',
  styleUrls: ['./verification.component.scss']
})
export class VerificationComponent {
  public status = signal<'idle' | 'processing' | 'valid' | 'invalid' | 'error'>('idle');
  public metadata = signal<any>(null);

  constructor(private http: HttpClient) {}

  async onFileDropped(event: any) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0] || event.target.files[0];
    if (file) this.processFile(file);
  }

  onDragOver(event: Event) {
    event.preventDefault();
    event.stopPropagation();
  }

  async processFile(file: File) {
    this.status.set('processing');
    
    try {
      // 1. Calculate Hash locally (Client-side)
      // This ensures the file contents NEVER leave the user's computer if valid
      const hash = await this.calculateSHA256(file);
      
      // 2. Send ONLY the hash to backend
      const apiUrl = baseURL + 'public/verify';
      
      this.http.post<any>(apiUrl, { hash }).subscribe({
        next: (res) => {
          if (res.valid) {
            this.status.set('valid');
            this.metadata.set(res.metadata);
          } else {
            this.status.set('invalid');
          }
        },
        error: () => this.status.set('error')
      });

    } catch (err) {
      console.error(err);
      this.status.set('error');
    }
  }

  private async calculateSHA256(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}