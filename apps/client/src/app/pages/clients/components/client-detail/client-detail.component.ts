import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, 
  IonSpinner, IonCard, IonCardContent, IonList, IonItem, IonLabel, IonIcon, 
  IonButton, IonSegment, IonSegmentButton, ModalController, AlertController, 
  ToastController, IonPopover 
} from '@ionic/angular/standalone';
import { ClientService } from '../../../../core/services/client.service';
import { ClientFormComponent } from '../client-form/client-form.component';
import { MatterService } from '../../../../core/services/matter.service';
import { addIcons } from 'ionicons';
import { 
  ellipsisVertical, mailOutline, callOutline, locationOutline, businessOutline,
  createOutline, trashOutline, briefcase, receipt, wallet, person, business,
  mail, call, logoWhatsapp, documentTextOutline, personCircleOutline, folderOpenOutline
} from 'ionicons/icons';
import { ClientFinancialsComponent } from "../client-financials/client-financials.component";

@Component({
  selector: 'app-client-detail',
  templateUrl: './client-detail.component.html',
  styleUrls: ['./client-detail.component.scss'],
  standalone: true,
  imports: [
    CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, 
    IonBackButton, IonSpinner, IonCard, IonCardContent, IonList, IonItem, 
    IonLabel, IonIcon, IonButton, IonSegment, IonSegmentButton, RouterLink, 
    IonPopover, ClientFinancialsComponent
  ]
})
export class ClientDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private modalCtrl = inject(ModalController);
  public clientsService = inject(ClientService);
  public mattersService = inject(MatterService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  public activeSegment = signal<'details' | 'matters' | 'financials'>('details');

  constructor() {
    addIcons({ 
      ellipsisVertical, mailOutline, callOutline, locationOutline, businessOutline,
      createOutline, trashOutline, briefcase, receipt, wallet, person, business,
      mail, call, logoWhatsapp, documentTextOutline, personCircleOutline, folderOpenOutline
    });
  }

  ngOnInit() {
    const clientId = this.route.snapshot.paramMap.get('id');
    if (clientId) {
      this.clientsService.getClientById(clientId).subscribe();
      this.mattersService.refreshMatters({ page: 1, pageSize: 50, clientId: clientId }).subscribe();
    }
  }

  segmentChanged(event: any) {
    this.activeSegment.set(event.detail.value);
  }

  async presentEditClientModal() {
    const client = this.clientsService.selectedClient();
    if (!client) return;

    const modal = await this.modalCtrl.create({
      component: ClientFormComponent,
      componentProps: { clientToEdit: client }
    });
    await modal.present();
  }

  async presentDeleteConfirm() {
    const alert = await this.alertCtrl.create({
      header: 'Delete Client',
      message: 'Are you sure? This action cannot be undone and will affect linked matters.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { 
          text: 'Delete', 
          role: 'confirm', 
          handler: () => this.deleteClient() 
        }
      ]
    });
    await alert.present();
  }

  private deleteClient() {
    const client = this.clientsService.selectedClient();
    if (client) {
      this.clientsService.deleteClient(client.id).subscribe({
        next: async () => {
          const toast = await this.toastCtrl.create({ message: 'Client deleted', duration: 2000, color: 'success' });
          toast.present();
          // Navigate back would be handled by your router logic usually
        },
        error: async () => {
          const toast = await this.toastCtrl.create({ message: 'Failed to delete', duration: 2000, color: 'danger' });
          toast.present();
        }
      });
    }
  }

  contactClient(method: 'call' | 'mail' | 'whatsapp', value: string) {
    if (!value) return;
    let link = '';
    if (method === 'call') link = `tel:${value}`;
    if (method === 'mail') link = `mailto:${value}`;
    if (method === 'whatsapp') link = `https://wa.me/${value.replace(/[^0-9]/g, '')}`;
    
    window.open(link, '_system');
  }
}