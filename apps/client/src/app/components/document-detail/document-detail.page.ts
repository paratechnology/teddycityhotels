import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Browser } from '@capacitor/browser';
import { ActivatedRoute, Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonSpinner, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonLabel, IonNote, IonIcon, IonButton, ToastController, ActionSheetController, IonListHeader, ModalController, LoadingController, IonAccordionGroup, IonAccordion, IonText } from '@ionic/angular/standalone';
import { MatterDocumentsService } from '../../core/services/matter-documents.service';
import { IDocument, IDocumentAccessLog, CreateDocumentDto, IDocumentVersion } from '@quickprolaw/shared-interfaces';
import { addIcons } from 'ionicons';
import { ellipsisVertical, documentTextOutline, saveOutline, trashOutline, createOutline, documentAttachOutline, eyeOutline, documentOutline, folderOutline, mailOutline, sendOutline, checkmarkCircle, timeOutline, lockClosedOutline, lockOpenOutline, personAddOutline, closeCircle, refreshOutline, ribbonOutline } from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { FirmService } from '../../core/services/firm.service';
import { BiometricSecurityService } from '../../core/services/biometric-security.service';
import { lastValueFrom } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import { SendDocumentModalComponent } from '../../pages/matters/components/send-document-modal/send-document-modal.component';
import { UserSelectModalComponent } from '../../shared/components/user-select-modal/user-select-modal.component';
import { UserService } from '../../core/services/user.service';
import { PdfSigningModalComponent } from '../../shared/components/pdf-signing-modal/pdf-signing-modal.component';
import { AlertController } from '@ionic/angular';

interface DocumentDetail {
  document: IDocument;
  accessLogs: IDocumentAccessLog[];
}

@Component({
  selector: 'app-document-detail',
  templateUrl: './document-detail.page.html',
  styleUrls: ['./document-detail.page.scss'],
  standalone: true, // Add UserSelectModalComponent here if it's standalone
  imports: [IonText, IonListHeader, CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonSpinner, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonLabel, IonNote, IonIcon, IonButton, IonAccordionGroup, IonAccordion]
})
export class DocumentDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private documentsService = inject(MatterDocumentsService);
  private toastCtrl = inject(ToastController);
  private modalCtrl = inject(ModalController);
  private loadingCtrl = inject(LoadingController);
  private authService = inject(AuthService);
  private firmService = inject(FirmService);
  private biometricService = inject(BiometricSecurityService);
  private userService = inject(UserService);
  private alertCtrl = inject(AlertController);

  public matterId: string;
  public documentId: string;

  public detail = signal<DocumentDetail | null>(null);
  public isLoading = signal(true);
  public integrationConfigured = computed(() => !!this.firmService.firmProfile()?.microsoftIntegration?.driveId);
  public showAllLogs = signal(false);

  constructor() {
    addIcons({ ellipsisVertical, documentTextOutline, folderOutline, saveOutline, trashOutline, createOutline, documentAttachOutline, eyeOutline, documentOutline, mailOutline, sendOutline, checkmarkCircle, timeOutline, lockClosedOutline, lockOpenOutline, personAddOutline, closeCircle, refreshOutline, ribbonOutline });
    const params = this.route.snapshot.paramMap;
    this.matterId = params.get('matterId')!;
    this.documentId = params.get('documentId')!;
  }

  ngOnInit() {
    this.loadDocumentDetails();
  }

  loadDocumentDetails() {
    this.isLoading.set(true);
    this.documentsService.getDocumentById(this.matterId, this.documentId).subscribe({
      next: (data) => {
        this.detail.set(data);
        this.isLoading.set(false);
      },
      error: async (err) => {
        this.isLoading.set(false);
        const toast = await this.toastCtrl.create({ message: 'Failed to load document details.', duration: 3000, color: 'danger' });
        toast.present();
        this.router.navigate(['/app/matters', this.matterId, 'documents']);
      }
    });
  }

  async handlePublish() {
    const detail = this.detail();
    if (!detail) return;
    const doc = detail.document;

    const loading = await this.loadingCtrl.create({ message: 'Converting and Publishing...' });
    await loading.present();
    this.documentsService.publishDocument(this.matterId, doc.id).subscribe({
      next: async () => {
        loading.dismiss();
        const toast = await this.toastCtrl.create({ message: 'Document published successfully.', color: 'success', duration: 2000 });
        toast.present();
        this.loadDocumentDetails();
      },
      error: async (err) => {
        loading.dismiss();
        const toast = await this.toastCtrl.create({ message: err.error?.message || 'Failed to publish.', color: 'danger', duration: 3000 });
        toast.present();
      }
    });
  }

  async handleUnpublish() {
    const detail = this.detail();
    if (!detail) return;
    const doc = detail.document;

    const alert = await this.alertCtrl.create({
      header: 'Unpublish Document?',
      message: 'This will void the current PDF and any signatures collected so far. The original Word document will become editable again.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Unpublish',
          role: 'destructive',
          handler: async () => {
            const loading = await this.loadingCtrl.create({ message: 'Reverting to Draft...' });
            await loading.present();
            this.documentsService.unpublishDocument(this.matterId, doc.id).subscribe({
              next: async () => {
                loading.dismiss();
                this.loadDocumentDetails();
              },
              error: async (err) => {
                loading.dismiss();
                const toast = await this.toastCtrl.create({ message: err.error?.message || 'Failed to unpublish.', color: 'danger', duration: 3000 });
                toast.present();
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async handleViewDocument() {
    const detail = this.detail();
    if (!detail || detail.document.provider !== 'microsoft') return;

    const toast = await this.toastCtrl.create({ message: 'Opening document...', duration: 1500 });
    toast.present();

    this.documentsService.generateViewLink(this.matterId, this.documentId).subscribe({
      next: async (linkData) => {
        await Browser.open({
          url: linkData.webUrl,
          presentationStyle: 'fullscreen',
          toolbarColor: '#ffffff'
        });
        Browser.addListener('browserFinished', () => this.loadDocumentDetails());
      },
      error: async (err) => {
        this.toastCtrl.create({ message: err.error?.message || 'Could not generate view link.', color: 'danger', duration: 3000 }).then(t => t.present());
      }
    });
  }

  async viewVersion(version: IDocumentVersion) {
    const toast = await this.toastCtrl.create({ message: 'Opening version...', duration: 1500 });
    toast.present();

    this.documentsService.generateVersionViewLink(this.matterId, this.documentId, version.itemId).subscribe({
      next: async (linkData) => {
        await Browser.open({ url: linkData.webUrl });
      },
      error: async (err) => {
        this.toastCtrl.create({ message: 'Could not open version.', color: 'danger', duration: 3000 }).then(t => t.present());
      }
    });
  }

  async revertVersion(version: IDocumentVersion) {
    const alert = await this.alertCtrl.create({
      header: 'Revert to Version?',
      message: `Are you sure you want to revert to version "${version.filename}"? All subsequent versions and signatures will be lost.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Revert',
          role: 'destructive',
          handler: async () => {
            const loading = await this.loadingCtrl.create({ message: 'Reverting document...' });
            await loading.present();
            this.documentsService.revertDocumentVersion(this.matterId, this.documentId, version.itemId).subscribe({
              next: async () => {
                loading.dismiss();
                const toast = await this.toastCtrl.create({ message: 'Document reverted successfully.', color: 'success', duration: 2000 });
                toast.present();
                this.loadDocumentDetails();
              },
              error: async (err) => {
                loading.dismiss();
                const toast = await this.toastCtrl.create({ message: err.error?.message || 'Failed to revert document.', color: 'danger', duration: 3000 });
                toast.present();
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async downloadCertificate() {
    const loading = await this.loadingCtrl.create({ message: 'Generating certificate...' });
    await loading.present();
    this.documentsService.downloadCertificate(this.matterId, this.documentId).subscribe({
      next: (blob) => {
        loading.dismiss();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Certificate_${this.documentId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => loading.dismiss()
    });
  }

  async handleEmailDocument() {
    const detail = this.detail();
    if (!detail) return;
    const modal = await this.modalCtrl.create({
      component: SendDocumentModalComponent,
      componentProps: { matterId: this.matterId, preselectedDocuments: [detail.document] }
    });
    await modal.present();
  }

  /**
   * This is the main internal signing flow for an authenticated user.
   */
  async handleSignDocument() {
    const detail = this.detail();
    if (!detail) return;
    const doc = detail.document;

    // 1. STRICT POLICY CHECK: Zero Custody
    if (!this.integrationConfigured()) return;

    // 2. Security Check: Verify Identity
    const verified = await this.biometricService.verifyIdentity('Verify identity to sign');
    if (!verified) return;

    // 3. Check Prerequisites & Add Self to Signers List
    const user = this.authService.userProfile();
    // console.log(user);
    if (!user?.signatureItemId) {
      const toast = await this.toastCtrl.create({ message: 'Please set up your e-signature in Profile first.', duration: 3000, color: 'warning' });
      toast.present();
      return;
    }

    // Add self to signers list if not already there
    const isAlreadySigner = doc.signers?.some(s => s.email === user.email);
    if (!isAlreadySigner) {
      await this.addSigner({ name: user.fullname, email: user.email });
      // We must wait for the state to update before proceeding
    }

    const loading = await this.loadingCtrl.create({ message: 'Preparing document...' });
    await loading.present();

    try {
      // Fetch signature blob to pass to modal (since direct URL fails auth in img tags)
      const signatureBlob = await lastValueFrom(this.userService.getSignatureImage());
      const signatureObjectUrl = URL.createObjectURL(signatureBlob);

      // 4. Get Direct Download URL (Zero Custody)
      const { downloadUrl } = await lastValueFrom(this.documentsService.getDirectDownloadUrl(this.matterId, doc.id));

      loading.dismiss();

      // 5. Open Signing Modal
      const modal = await this.modalCtrl.create({
        component: PdfSigningModalComponent,
        componentProps: {
          downloadUrl: downloadUrl,
          signatureUrl: signatureObjectUrl,
          userFullname: user.fullname,
          auditId: crypto.randomUUID()
        }
      });

      await modal.present();

      // 6. Handle Result
      const { data, role } = await modal.onDidDismiss();

      URL.revokeObjectURL(signatureObjectUrl);

      if (role === 'confirm' && data) {
        await this.handleSignedUpload(data.signedBlob, doc, data.fileHash);
      }

    } catch (error: any) {
      loading.dismiss();
      console.error(error);
      const toast = await this.toastCtrl.create({ message: 'Failed to initialize signing.', duration: 3000, color: 'danger' });
      toast.present();
    }
  }

  async handleSignedUpload(blob: Blob, originalDoc: IDocument, fileHash: string) {
    if (!this.integrationConfigured()) {
      const toast = await this.toastCtrl.create({ message: 'Error: Integration missing. Cannot save securely.', duration: 3000, color: 'danger' });
      toast.present();
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Saving securely to OneDrive...' });
    await loading.present();

    try {
      // Calculate next version number
      // If versions=[] (current is v1), next is v2. If versions=[v1] (current is v2), next is v3.
      const nextVersion = (originalDoc.versions?.length || 0) + 2;
      const baseName = originalDoc.filename?.replace(/_v\d+\.pdf$/, "").replace(/\.pdf$/, "") || 'Document';
      const targetFileName = `${baseName}_v${nextVersion}.pdf`;

      const signedFile = new File([blob], targetFileName, { type: 'application/pdf' });

      // Prepare signer info for the current user
      const user = this.authService.userProfile();
      const currentSigner = {
        name: user?.fullname || 'Unknown',
        email: user?.email || '',
        status: 'signed',
        date: new Date().toISOString()
      };

      // 1. Upload the new file version to OneDrive
      const session = await lastValueFrom(this.documentsService.initiateMicrosoftUpload(this.matterId, targetFileName));
      const uploadResponse = await lastValueFrom(this.documentsService.uploadFileToMicrosoft(session.uploadUrl, signedFile)) as HttpResponse<any>;
      const driveItemId = uploadResponse.body.id;


      // 2. Update the EXISTING document record to point to this new file
      // This preserves the ID but updates the content, creating a version history in the DB
      await lastValueFrom(this.documentsService.updateSignedDocument(this.matterId, originalDoc.id, originalDoc.itemId, driveItemId, fileHash));

      const toast = await this.toastCtrl.create({ message: 'Document signed and updated successfully.', duration: 3000, color: 'success' });
      toast.present();

      this.loadDocumentDetails();
    } catch (error) {
      console.error(error);
      const toast = await this.toastCtrl.create({ message: 'Failed to save signed document.', duration: 3000, color: 'danger' });
      toast.present();
    } finally {
      loading.dismiss();
    }
  }

  async triggerSignerInvite(signer: { name: string, email: string }) {
    const loading = await this.loadingCtrl.create({ message: 'Sending invitation...' });
    await loading.present();

    this.documentsService.sendGuestInvite(this.matterId, this.documentId, [signer]).subscribe({
      next: async () => {
        loading.dismiss();
        const toast = await this.toastCtrl.create({ message: 'Invitation sent!', color: 'success', duration: 2000 });
        toast.present();
        this.loadDocumentDetails(); // Refresh to show the new audit log
      },
      error: async (err) => {
        loading.dismiss();
        console.error(err);
        const toast = await this.toastCtrl.create({ message: 'Failed to send invite.', color: 'danger', duration: 3000 });
        toast.present();
      }
    });
  }

  getFileIcon(filename: string): string {
    if (!filename) return 'document-outline';
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'document-text-outline'; // Or a specific PDF icon
    if (['doc', 'docx'].includes(ext || '')) return 'document-text-outline';
    return 'document-outline';
  }

  canSign(filename?: string): boolean {
    if (!filename) return false;
    // In the new workflow, only published PDFs can be signed.
    return this.detail()?.document.status === 'published' && !this.hasSigned();
  }

  hasSigned(): boolean {
    const user = this.authService.userProfile();
    const signers = this.detail()?.document.signers || [];
    return signers.some(s => s.email === user?.email && s.status === 'signed');
  }

  handleRefresh(event: any) {
    this.loadDocumentDetails();
    event.target.complete();
  }

  toggleLogs() {
    this.showAllLogs.update(v => !v);
  }

  // --- New Signatory Management Methods ---

  async presentAddSignatoryOptions() {
    const actionSheet = await this.alertCtrl.create({
      header: 'Add Signatory',
      buttons: [
        { text: 'Add Myself', handler: () => this.addMyselfAsSigner() },
        { text: 'Add Firm User', handler: () => this.openUserSelect() },
        { text: 'Add External Party', handler: () => this.promptExternalSigner() },
        { text: 'Cancel', role: 'cancel' }
      ]
    });
    await actionSheet.present();
  }

  private addMyselfAsSigner() {
    const user = this.authService.userProfile();
    if (user) {
      this.addSigner({ name: user.fullname, email: user.email });
    }
  }

  private async openUserSelect() {
    const modal = await this.modalCtrl.create({ component: UserSelectModalComponent });
    await modal.present();
    const { data, role } = await modal.onWillDismiss();
    if (role === 'confirm' && data) {
      this.addSigner({ name: data.fullname, email: data.email });
    }
  }

  private async promptExternalSigner() {
    const alert = await this.alertCtrl.create({
      header: 'Add External Signatory',
      inputs: [
        { name: 'name', type: 'text', placeholder: 'Full Name' },
        { name: 'email', type: 'email', placeholder: 'Email Address' }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Add', handler: (data) => {
            if (data.email && data.name) {
              this.addSigner(data);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  private async addSigner(signer: { name: string, email: string }) {
    const currentSigners = this.detail()?.document.signers || [];
    if (currentSigners.some(s => s.email === signer.email)) {
      this.toastCtrl.create({ message: 'This user is already a signatory.', color: 'warning', duration: 2000 }).then(t => t.present());
      return;
    }

    const newSigner = {
      ...signer,
      status: 'pending',
      date: new Date().toISOString(),
      order: currentSigners.length
    };

    await this.saveSigners([...currentSigners, newSigner]);
  }

  async removeSigner(index: number) {
    const currentSigners = this.detail()?.document.signers || [];
    const updatedSigners = currentSigners.filter((_, i) => i !== index)
      .map((signer, newIndex) => ({ ...signer, order: newIndex })); // Re-order

    await this.saveSigners(updatedSigners);
  }

  private async saveSigners(signers: any[]) {
    await lastValueFrom(this.documentsService.updateDocument(this.matterId, this.documentId, { signers }));
    this.loadDocumentDetails(); // Refresh state
  }
}
