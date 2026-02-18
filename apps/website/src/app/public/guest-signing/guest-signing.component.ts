import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { PdfSigningDialogComponent } from '../pdf-signing-dialog/pdf-signing-dialog.component';
import { baseURL } from '@quickprolaw/shared-interfaces';
import { IonSpinner } from "@ionic/angular/standalone";

@Component({
  selector: 'app-guest-signing',
  standalone: true,
  imports: [ 
    CommonModule, 
    FormsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule
  ], 
  templateUrl: './guest-signing.component.html',
  styleUrls: ['./guest-signing.component.scss']
})
export class GuestSigningComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // State Signals
  step = signal<'loading' | 'otp' | 'ready' | 'success' | 'error'>('loading');
  emailMasked = signal<string>('');
  signerName = signal<string>('');
  otpInput = signal<string>('');
  nextVersion = signal<number>(2); // Default to 2 if not provided
  headItemId = signal<string | undefined>(undefined); // The ID of the version we are signing on top of
  isProcessing = signal<boolean>(false);
  
  private token = '';
  private apiUrl = baseURL; 

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (!this.token) {
        this.step.set('error');
        return;
      }
      this.initSession();
    });
  }

  /** Step 1: Validate Token & Request OTP */
  initSession() {
    this.step.set('loading');
    this.http.post<{ email: string, maskedEmail: string, signerName?: string, nextVersion?: number, headItemId?: string }>(`${this.apiUrl}/guest/send-otp`, { token: this.token })
      .subscribe({
        next: (res) => {
          this.emailMasked.set(res.maskedEmail);
          if (res.signerName) this.signerName.set(res.signerName);
          if (res.nextVersion) this.nextVersion.set(res.nextVersion);
          if (res.headItemId) this.headItemId.set(res.headItemId);
          this.step.set('otp');
        },
        error: (err) => {
          console.error(err);
          this.step.set('error');
        }
      });
  }

  /** Step 2: Verify OTP */
  verifyOtp() {
    if (this.otpInput().length < 6) return;
    this.isProcessing.set(true);

    this.http.post(`${this.apiUrl}guest/verify`, { token: this.token, otp: this.otpInput() })
      .subscribe({
        next: () => {
          this.isProcessing.set(false);
          this.step.set('ready');
        },
        error: () => {
          this.isProcessing.set(false);
          this.snackBar.open('Invalid Code. Please try again.', 'Close', { duration: 3000, panelClass: 'error-snack' });
        }
      });
  }

  /** Step 3: Open Signing Dialog (Material) */
  async openSigningModal(retryData?: { signatureImage: string, sigPosition: any, pageIndex: number }) {
    this.isProcessing.set(true);
    
    try {
      // 1. Get Direct Link (Zero Custody)
      const res = await this.http.get<{ downloadUrl: string }>(`${this.apiUrl}/guest/documents/${this.token}/download-link`).toPromise();
      if (!res?.downloadUrl) throw new Error('Could not retrieve document.');

      this.isProcessing.set(false);

      // 2. Open Dialog with Direct Link
      const dialogRef = this.dialog.open(PdfSigningDialogComponent, {
        width: '100%',
        maxWidth: '900px',
        height: '90vh',
        panelClass: 'signing-dialog-container',
        data: {
          downloadUrl: res.downloadUrl,
          userFullname: this.signerName() || 'Guest Signer',
          auditId: 'GUEST-' + Date.now().toString().slice(-6),
          initialSignatureImage: retryData?.signatureImage,
          initialSigPosition: retryData?.sigPosition,
          initialPageIndex: retryData?.pageIndex
        },
        disableClose: true
      });

      dialogRef.afterClosed().subscribe(async (result) => {
        if (result && result.action === 'decline') {
          await this.declineSigning();
        } else if (result && result.signedBlob) {
          await this.uploadSignedFile(result.signedBlob, result);
        }
      });
    } catch (err) {
      this.isProcessing.set(false);
      this.snackBar.open('Failed to load document. Please try again.', 'Close');
    }
  }

  /** Step 4: Upload back to Firm's OneDrive */
  async uploadSignedFile(blob: Blob, signatureData: any) {
    this.isProcessing.set(true);
    
    try {
      // Include signer name in filename for better identification
      // We use a generic name with versioning to keep it clean, or append the signer name if preferred.
      const fileName = `Document_v${this.nextVersion()}.pdf`;
      const res = await this.http.post<{ uploadUrl: string }>(
        `${this.apiUrl}/guest/documents/${this.token}/upload-url`, 
        { fileName }
      ).toPromise();

      if (!res?.uploadUrl) throw new Error('No upload URL returned');

      // 1. Upload to Microsoft Graph
      const uploadRes = await fetch(res.uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Range': `bytes 0-${blob.size - 1}/${blob.size}` }
      });

      if (!uploadRes.ok) throw new Error('Upload to OneDrive failed');
      const driveItemId = (await uploadRes.json()).id;
      // 2. Finalize: Create Record in Database
      // We send the DriveItem metadata so the backend can create the IDocument record
      await this.http.post(`${this.apiUrl}/guest/documents/${this.token}/finalize`, { 
        driveItemId: driveItemId,
        sourceItemId: this.headItemId(), // Declare our dependency: "I signed on top of this version"
        fileHash: signatureData.fileHash
      }).toPromise();

      this.step.set('success');

    } catch (error: any) {
      console.error(error);
      
      // Handle Race Condition (409 Conflict)
      if (error.status === 409) {
        this.snackBar.open('Someone else just signed. Updating document...', 'OK', { duration: 3000 });
        
        // 1. Refresh Metadata (Get new headItemId and nextVersion)
        const meta = await this.http.get<{ headItemId: string, nextVersion: number }>(
          `${this.apiUrl}/guest/documents/${this.token}/metadata`
        ).toPromise();

        if (meta) {
          this.headItemId.set(meta.headItemId);
          this.nextVersion.set(meta.nextVersion);
          
          // 2. Re-open modal with the NEW stream (via token) and OLD signature data
          this.openSigningModal(signatureData);
        }
      } else {
        this.snackBar.open('Failed to save document.', 'Retry', { duration: 5000 });
      }
    } finally {
      this.isProcessing.set(false);
    }
  }

  async declineSigning() {
    if (!confirm('Are you sure you want to decline signing this document? The sender will be notified.')) return;
    
    this.isProcessing.set(true);
    try {
      await this.http.post(`${this.apiUrl}/guest/documents/${this.token}/decline`, {}).toPromise();
      this.snackBar.open('You have declined to sign the document.', 'Close', { duration: 5000 });
      this.step.set('error'); // Or a dedicated 'declined' state/view
    } catch (error) {
      console.error(error);
      this.snackBar.open('Failed to process decline.', 'Retry', { duration: 3000 });
    } finally {
      this.isProcessing.set(false);
    }
  }
}