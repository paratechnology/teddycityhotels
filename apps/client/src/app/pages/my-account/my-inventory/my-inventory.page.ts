import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonButtons, IonTitle, IonContent, 
  IonList, IonItem, IonLabel, IonSpinner, IonIcon, IonButton, 
  ModalController, ToastController, IonChip 
} from '@ionic/angular/standalone';
import { IinventoryItem, IFirmUser } from '@teddy-city-hotels/shared-interfaces';
import { addIcons } from 'ionicons';
import { 
  swapHorizontalOutline, returnUpBackOutline, menuOutline, refreshOutline,
  folderOpenOutline, documentTextOutline, bookOutline, fileTrayOutline 
} from 'ionicons/icons';
import { Observable } from 'rxjs';
import { FileLogService } from '../../../core/services/file-log.service';
import { GeneralFileService } from '../../../core/services/general-file.service';
import { LibraryService } from '../../../core/services/library.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { UserService } from '../../../core/services/user.service';
import { UserSelectModalComponent } from '../../../shared/components/user-select-modal/user-select-modal.component';

// Services

@Component({
  selector: 'app-my-inventory',
  templateUrl: './my-inventory.page.html',
  styleUrls: ['./my-inventory.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonHeader, IonToolbar, IonButtons, IonTitle, IonContent, 
    IonSpinner, IonIcon, IonButton, IonChip
  ]
})
export class MyInventoryPage implements OnInit {
  public navigationService = inject(NavigationService);
  private userService = inject(UserService);
  private fileLogService = inject(FileLogService);
  private generalFileService = inject(GeneralFileService);
  private libraryService = inject(LibraryService);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);

  public possessions = signal<IinventoryItem[]>([]);
  public isLoading = signal(true);

  constructor() {
    addIcons({ 
      swapHorizontalOutline, returnUpBackOutline, menuOutline, refreshOutline,
      folderOpenOutline, documentTextOutline, bookOutline, fileTrayOutline
    });
  }

  ngOnInit() {
    this.loadPossessions();
  }

  loadPossessions() {
    this.isLoading.set(true);
    // Use UserService to get the aggregated list of possessions
    this.userService.getMyPossessions().subscribe({
      next: (items) => {
        // Sort by most recently moved/acquired
        const sorted = items.sort((a, b) => 
          new Date(b.lastMoved || 0).getTime() - new Date(a.lastMoved || 0).getTime()
        );
        this.possessions.set(sorted);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  // --- UI HELPERS ---
  getItemIcon(type: string): string {
    if (type === 'Matter File') return 'folder-open-outline';
    if (type === 'Library Book') return 'book-outline';
    return 'document-text-outline';
  }

  getItemClass(type: string): string {
    if (type === 'Matter File') return 'matter-file';
    if (type === 'Library Book') return 'library-book';
    return 'general-file';
  }

  getTypeColor(type: string): string {
    if (type === 'Matter File') return 'warning';
    if (type === 'Library Book') return 'success';
    return 'primary';
  }

  // --- ACTIONS ---

  async transferItem(item: IinventoryItem) {
    // 1. Library Restriction
    if (item.type === 'Library Book') {
      const toast = await this.toastCtrl.create({ 
        message: 'Books cannot be transferred. Please return them to the library.', 
        duration: 2500, 
        color: 'warning' 
      });
      await toast.present();
      return;
    }

    // 2. Select Recipient
    const modal = await this.modalCtrl.create({
      component: UserSelectModalComponent,
      componentProps: { title: `Transfer "${item.name}"` }
    });
    await modal.present();
    const { data } = await modal.onWillDismiss<IFirmUser>();

    if (data) {
      // 3. Initiate Transfer based on Type
      let obs$: Observable<any>;
      
      if (item.type === 'Matter File') {
        obs$ = this.fileLogService.initiateTransfer(item.id, data.id);
      } else {
        obs$ = this.generalFileService.initiateTransfer(item.id, data.id);
      }

      obs$.subscribe({
        next: async () => {
          const toast = await this.toastCtrl.create({ 
            message: `Transfer to ${data.fullname} initiated.`, 
            duration: 3000, 
            color: 'success' 
          });
          await toast.present();
          this.loadPossessions(); // Refresh list to show status change if backend handles it
        },
        error: async () => {
          const toast = await this.toastCtrl.create({ 
            message: 'Transfer failed. Please try again.', 
            duration: 3000, 
            color: 'danger' 
          });
          await toast.present();
        }
      });
    }
  }

  // Unified handler called from HTML
  async returnItem(item: IinventoryItem) {
    // 1. Determine Logic based on Type
    let obs$: Observable<any>;

    if (item.type === 'Library Book') {
      obs$ = this.libraryService.returnBook(item.id);
    } else if (item.type === 'Matter File') {
      obs$ = this.fileLogService.returnToFileRoom(item.id);
    } else {
      obs$ = this.generalFileService.returnToFileRoom(item.id);
    }

    // 2. Execute
    obs$.subscribe({
      next: async () => {
        const dest = item.type === 'Library Book' ? 'Library' : 'File Room';
        const toast = await this.toastCtrl.create({ 
          message: `Returned to ${dest} successfully.`, 
          duration: 2000, 
          color: 'success' 
        });
        await toast.present();
        this.loadPossessions();
      },
      error: async () => {
        const toast = await this.toastCtrl.create({ 
          message: 'Return failed. Please try again.', 
          duration: 3000, 
          color: 'danger' 
        });
        await toast.present();
      }
    });
  }
}