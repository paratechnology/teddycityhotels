import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, ModalController } from '@ionic/angular/standalone';
import { ImageCroppedEvent, ImageCropperComponent } from 'ngx-image-cropper';

@Component({
  selector: 'app-image-cropper-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Crop Your Photo</ion-title>
        <ion-buttons slot="start">
          <ion-button (click)="cancel()">Cancel</ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button (click)="crop()" [disabled]="!croppedImage">Save</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="cropper-container">
        <image-cropper
          [imageChangedEvent]="imageChangedEvent"
          [maintainAspectRatio]="true"
          [aspectRatio]="1 / 1"
          [roundCropper]="true"
          format="png"
          (imageCropped)="imageCropped($event)"
          (loadImageFailed)="loadImageFailed()"
        ></image-cropper>
      </div>
    </ion-content>
  `,
  styles: [`.cropper-container { height: 100%; width: 100%; background-color: #333; }`],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, ImageCropperComponent],
})
export class ImageCropperModalComponent {
  @Input() imageChangedEvent: any;
  private modalCtrl = inject(ModalController);
  croppedImage: Blob | null | undefined = null;

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.blob;
  }

  loadImageFailed() { this.modalCtrl.dismiss(null, 'error'); }
  cancel() { this.modalCtrl.dismiss(null, 'cancel'); }
  crop() { this.modalCtrl.dismiss(this.croppedImage, 'confirm'); }
}