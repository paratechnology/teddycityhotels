import { AfterViewInit, Component, ElementRef, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonIcon 
} from '@ionic/angular/standalone';
import SignaturePad from 'signature_pad';
import { addIcons } from 'ionicons';
import { checkmarkOutline, refreshOutline, lockClosedOutline } from 'ionicons/icons';
import { ModalController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-signature-modal',
  templateUrl: './signature-modal.component.html',
  styleUrls: ['./signature-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonIcon]
})
export class SignatureModalComponent implements AfterViewInit {
  private modalCtrl = inject(ModalController);
  @ViewChild('canvas') canvasEl!: ElementRef<HTMLCanvasElement>;
  private signaturePad!: SignaturePad;

  constructor() {
    addIcons({ checkmarkOutline, refreshOutline, lockClosedOutline });
  }

  ngAfterViewInit() {
    // Delay slightly to ensure modal animation allows correct dimension calculation
    setTimeout(() => {
      this.initializeSignaturePad();
    }, 400);
  }

  private initializeSignaturePad() {
    if (!this.canvasEl) return;
    const canvas = this.canvasEl.nativeElement;

    if (canvas.offsetWidth === 0 || canvas.offsetHeight === 0) return;

    // Handle High DPI
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d')?.scale(ratio, ratio);

    this.signaturePad = new SignaturePad(canvas, {
      backgroundColor: 'rgba(255, 255, 255, 0)', 
      penColor: 'rgb(0, 0, 0)',
      velocityFilterWeight: 0.7
    });
  }

  clearPad() {
    this.signaturePad.clear();
  }

  async save() {
    if (this.signaturePad.isEmpty()) {
      // Maybe show a toast or just dismiss
      this.modalCtrl.dismiss(null, 'cancel');
      return;
    }

    const dataUrl = this.signaturePad.toDataURL('image/png');
    
    // Convert Data URL to Blob
    const res = await fetch(dataUrl);
    const blob = await res.blob();

    this.modalCtrl.dismiss({ blob, dataUrl }, 'confirm');
  }

  dismiss() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}