import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonList, IonItem, IonIcon, IonLabel, IonNote, IonItemSliding, IonItemOptions, IonItemOption, AlertController, ToastController } from '@ionic/angular/standalone';
import { IAttachment } from '@quickprolaw/shared-interfaces';
import { addIcons } from 'ionicons';
import { documentTextOutline, imageOutline, musicalNotesOutline, filmOutline, archiveOutline, trash } from 'ionicons/icons';
import { AttachmentService } from '../../core/services/attachment.service';

@Component({
  selector: 'app-attachment-list',
  templateUrl: './attachment-list.component.html',
  styleUrls: ['./attachment-list.component.scss'],
  standalone: true,
  imports: [CommonModule, IonList, IonItem, IonIcon, IonLabel, IonNote, IonItemSliding, IonItemOptions, IonItemOption]
})
export class AttachmentListComponent {
  @Input() attachments: IAttachment[] = [];
  @Input() taskId!: string;
  @Output() attachmentDeleted = new EventEmitter<void>();

  private attachmentService = inject(AttachmentService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  constructor() {
    addIcons({ documentTextOutline, imageOutline, musicalNotesOutline, filmOutline, archiveOutline, trash });
  }

  async confirmDelete(attachment: IAttachment, slidingItem: IonItemSliding) {
    const alert = await this.alertCtrl.create({
      header: 'Delete File?',
      message: `Are you sure you want to permanently delete "${attachment.fileName}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel', handler: () => slidingItem.close() },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => this.deleteAttachment(attachment, slidingItem)
        }
      ]
    });
    await alert.present();
  }

  private deleteAttachment(attachment: IAttachment, slidingItem: IonItemSliding) {
    this.attachmentService.deleteAttachment(this.taskId, attachment.id).subscribe({
      next: () => this.attachmentDeleted.emit(),
      error: async () => { /* ... error handling ... */ },
      complete: () => slidingItem.close()
    });
  }

  getIconForMimeType(contentType: string): string {
    if (contentType.startsWith('image/')) return 'image-outline';
    if (contentType.startsWith('audio/')) return 'musical-notes-outline';
    if (contentType.startsWith('video/')) return 'film-outline';
    if (contentType === 'application/pdf') return 'document-text-outline';
    return 'archive-outline';
  }
}