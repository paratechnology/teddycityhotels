import { Component, ElementRef, Inject, OnInit, ViewChild, signal, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import * as pdfjsLib from 'pdfjs-dist';
import SignaturePad from 'signature_pad';
import { ImageProcessingService, ClientSignatureService } from '@quickprolaw/shared-services';
import { IonItem, IonCheckbox, IonLabel } from "@ionic/angular/standalone";
import { FormsModule } from '@angular/forms';

// Set worker src
pdfjsLib.GlobalWorkerOptions.workerSrc = './assets/pdf.worker.min.mjs';

@Component({
  selector: 'app-pdf-signing-dialog',
  standalone: true,
  imports: [ 
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatToolbarModule
  ],
  templateUrl: './pdf-signing-dialog.component.html',
  styleUrls: ['./pdf-signing-dialog.component.scss']
})
export class PdfSigningDialogComponent implements OnInit, AfterViewInit {
  @ViewChild('pdfCanvas') pdfCanvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('sigPadCanvas') sigPadCanvas!: ElementRef<HTMLCanvasElement>;

  // 👇 Inject Image Processor
  private imageService = inject(ImageProcessingService);
  private signatureService = inject(ClientSignatureService);

  // Inputs
  downloadUrl: string;
  userFullname: string;
  auditId: string;

  includeStamp = true; // Default to TRUE for guests, no UI option
  // State
  step = signal<'create' | 'place'>('create');
  isLoaded = signal(false);
  isProcessing = signal(false); // New state for processing upload
  currentPage = signal(1);
  totalPages = signal(1);

  pdfDoc: any = null;
  pdfBytes: ArrayBuffer | null = null;

  signaturePad: SignaturePad | null = null;
  signatureImage: string | null = null;
  sigPosition = { x: 50, y: 50 };
  isDragging = false;

  data: any = inject(MAT_DIALOG_DATA);

  constructor(
    public dialogRef: MatDialogRef<PdfSigningDialogComponent>,
  ) {
    this.downloadUrl = this.data?.downloadUrl;
    this.userFullname = this.data?.userFullname;
    this.auditId = this.data?.auditId;

    // Auto-Fix: Restore previous state if provided
    if (this.data?.initialSignatureImage) {
      this.signatureImage = this.data.initialSignatureImage;
      this.step.set('place');
      if (this.data.initialSigPosition) {
        this.sigPosition = this.data.initialSigPosition;
      }
      if (this.data.initialPageIndex !== undefined) {
        this.currentPage.set(this.data.initialPageIndex + 1); // Convert 0-based to 1-based
      }
    }
  }

  async ngOnInit() {
    await this.loadPdf();
  }

  ngAfterViewInit() {
    if (this.step() === 'create') {
      this.initSigPad();
    }
    // If we started in 'place' mode (retry), render the page immediately
    if (this.step() === 'place') {
      setTimeout(() => this.renderPage(this.currentPage()), 100);
    }
  }

  initSigPad() {
    setTimeout(() => {
      if (this.sigPadCanvas) {
        this.signaturePad = new SignaturePad(this.sigPadCanvas.nativeElement, {
          backgroundColor: 'rgba(255, 255, 255, 0)',
          penColor: 'rgb(0, 0, 0)',
          minWidth: 1.5, // Thicker line for better visibility
          maxWidth: 3.5, // Pressure sensitivity range
          throttle: 8,   // Lower throttle for smoother, more responsive drawing
          velocityFilterWeight: 0.7
        });
        this.resizeCanvas();
      }
    }, 100);
  }

  resizeCanvas() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const canvas = this.sigPadCanvas.nativeElement;
    if (canvas) {
      canvas.width = canvas.clientWidth * ratio;
      canvas.height = canvas.clientHeight * ratio;
      canvas.getContext('2d')?.scale(ratio, ratio);
      this.signaturePad?.clear();
    }
  }

  // --- 1. DRAW ACTION ---
  adoptDrawnSignature() {
    if (this.signaturePad && !this.signaturePad.isEmpty()) {
      this.signatureImage = this.signaturePad.toDataURL('image/png');
      this.goToPlaceStep();
    } else {
      alert('Please sign before continuing.');
    }
  }

  // --- 2. UPLOAD ACTION (NEW) ---
  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.isProcessing.set(true);

    try {
      // Use the service to remove background!
      const processedBlob = await this.imageService.removeBackground(file);

      // Convert Blob to Base64 for display
      const reader = new FileReader();
      reader.onloadend = () => {
        this.signatureImage = reader.result as string;
        this.isProcessing.set(false);
        this.goToPlaceStep();
      };
      reader.readAsDataURL(processedBlob);

    } catch (err) {
      console.error(err);
      this.isProcessing.set(false);
      alert('Could not process image.');
    }
  }

  // --- 3. TEXT ACTION ---
  useTextSignature() {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 150;
    const ctx = canvas.getContext('2d')!;
    ctx.font = 'bold 60px "Courier New"';
    ctx.fillStyle = 'black';
    ctx.fillText(this.userFullname, 10, 80);
    this.signatureImage = canvas.toDataURL('image/png');
    this.goToPlaceStep();
  }

  // --- Helper ---
  goToPlaceStep() {
    this.step.set('place');
    setTimeout(() => this.renderPage(this.currentPage()), 100);
  }

  // --- PDF & Dragging Logic (Same as before) ---
  clearSignature() { this.signaturePad?.clear(); }

  async loadPdf() {
    try {
      const response = await fetch(this.downloadUrl);
      this.pdfBytes = await response.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: this.pdfBytes.slice(0) });
      this.pdfDoc = await loadingTask.promise;
      this.totalPages.set(this.pdfDoc.numPages);
      this.isLoaded.set(true);
    } catch (err) {
      this.dialogRef.close();
    }
  }

  async renderPage(num: number) {
    if (!this.pdfCanvasElement) return;
    const page = await this.pdfDoc.getPage(num);
    const canvas = this.pdfCanvasElement.nativeElement;
    const ctx = canvas.getContext('2d');

    // Responsive scaling: Fit to container width (minus padding)
    const containerWidth = this.pdfCanvasElement.nativeElement.parentElement?.clientWidth || window.innerWidth;
    const desiredWidth = Math.min(containerWidth - 20, 800); // Max width 800px
    const viewport = page.getViewport({ scale: 1 });
    const scale = desiredWidth / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    canvas.height = scaledViewport.height;
    canvas.width = scaledViewport.width;
    await page.render({ canvasContext: ctx!, viewport: scaledViewport }).promise;
  }

  startDrag(event: MouseEvent | TouchEvent) { this.isDragging = true; }
  endDrag() { this.isDragging = false; }

  placeSignatureAtClick(event: MouseEvent) {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    // Center the 150px wide signature (offset by 75px)
    this.sigPosition = { x: event.clientX - rect.left - 75, y: event.clientY - rect.top - 37.5 };
  }

  async signAndSave() {
    if (!this.pdfBytes || !this.signatureImage || !this.pdfCanvasElement) return;

    // 1. Get geometry from PDFJS (already loaded) to calculate ratio
    const page = await this.pdfDoc.getPage(this.currentPage());
    const viewport = page.getViewport({ scale: 1 }); // True PDF dimensions
    const canvas = this.pdfCanvasElement.nativeElement;
    
    // Calculate scale ratio between PDF points and Canvas pixels
    const ratio = viewport.width / canvas.width;

    // 2. Prepare Signature Data
    const signatureBytes = await fetch(this.signatureImage).then(res => res.arrayBuffer());

    // 3. Delegate to Service
    const result = await this.signatureService.signPdfBrowser(
      this.pdfBytes,
      signatureBytes,
      {
        x: this.sigPosition.x * ratio,
        y: this.sigPosition.y * ratio,
        width: 150 * ratio, // Scale the 150px visual width to PDF units
        pageIndex: this.currentPage() - 1,
        fullName: this.userFullname,
        auditId: this.auditId,
        addVerificationStamp: this.includeStamp
      }
    );

    // Return signature metadata to allow auto-fix/retry in parent
    this.dialogRef.close({ 
      signedBlob: result.signedBlob,
      signatureImage: this.signatureImage,
      sigPosition: this.sigPosition,
      pageIndex: this.currentPage() - 1,
      fileHash: result.fileHash
    });
  }

  decline() {
    this.dialogRef.close({ action: 'decline' });
  }

  close() { this.dialogRef.close(); }
  nextPage() { if (this.currentPage() < this.totalPages()) { this.currentPage.update(p => p + 1); this.renderPage(this.currentPage()); } }
  prevPage() { if (this.currentPage() > 1) { this.currentPage.update(p => p - 1); this.renderPage(this.currentPage()); } }
}