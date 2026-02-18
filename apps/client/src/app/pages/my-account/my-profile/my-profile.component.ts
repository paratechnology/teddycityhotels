import { Component, OnInit, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonList, IonItem, IonInput, IonButton, IonSpinner, IonLabel, IonNote, ToastController, IonToggle, IonListHeader, ModalController, IonHeader, IonToolbar, IonContent, IonTitle, AlertController, ActionSheetController, LoadingController, IonButtons, IonMenuButton, IonChip } from '@ionic/angular/standalone';
import { IonAvatar, IonIcon } from '@ionic/angular/standalone';
import { AuthService } from '../../../core/services/auth.service';
import { IFirmUser, baseURL } from '@quickprolaw/shared-interfaces';
import { finalize } from 'rxjs';
import { addIcons } from 'ionicons';
import { cameraOutline, personCircleOutline, cloudUploadOutline, trashOutline, logoMicrosoft, calendarOutline, createOutline, menuOutline, shieldCheckmarkOutline, checkmarkCircle } from 'ionicons/icons';
import { ImageCropperModalComponent } from '../../../shared/components/image-cropper-modal/image-cropper-modal.component';
import { UserService } from '../../../core/services/user.service';
import { environment } from '../../../../environments/environment';
import { SignatureModalComponent } from '../../../components/signature-modal/signature-modal.component';
import { NavigationService } from '../../../core/services/navigation.service';
import { BiometricSecurityService } from '../../../core/services/biometric-security.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ImageProcessingService } from '@quickprolaw/shared-services';
@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.scss'],
  standalone: true,
  imports: [IonChip, IonButtons, IonTitle, IonContent, IonToolbar, IonHeader, CommonModule, ReactiveFormsModule, IonInput, IonButton, IonSpinner, IonLabel, IonAvatar, IonIcon]
})
export class MyProfileComponent implements OnInit {
  public authService = inject(AuthService);
  public userService = inject(UserService);
  private fb = inject(FormBuilder);
  private toastCtrl = inject(ToastController);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private loadingCtrl = inject(LoadingController);
  private actionSheetCtrl = inject(ActionSheetController);
  public navigationService = inject(NavigationService);
  private biometricService = inject(BiometricSecurityService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private imageProcessing = inject(ImageProcessingService);

  @ViewChild('signatureUploadInput') signatureUploadInput!: ElementRef<HTMLInputElement>;
  public profileForm!: FormGroup;
  public isSubmitting = signal(false);
  public isUploadingProfilePic = signal(false);
  public isUploadingSignature = signal(false);
  public profilePictureTimestamp = signal(Date.now());
  private currentUser: IFirmUser | null = null;
  public signatureUrl = signal<SafeUrl | null>(null);

  constructor() {
  addIcons({ 
    cameraOutline, personCircleOutline, cloudUploadOutline, trashOutline, 
    logoMicrosoft, createOutline, checkmarkCircle, shieldCheckmarkOutline, menuOutline, calendarOutline 
  });
}

  ngOnInit() {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      otherNames: [''],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
    });

    // Fetch the latest user profile from the server to populate the form
    this.userService.getMyProfile().subscribe(user => {
      if (user) {
        this.currentUser = user;
        this.profileForm.patchValue(user);
        this.authService.userProfile.set(user); // Also update the global signal

        if (user.signatureItemId) {
          this.loadSignature();
        }
      }
    });

    // Handle Microsoft Auth Redirect
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      const state = params['state'];
      if (code && state === 'personal_signature_setup') {
        this.handleMicrosoftCallback(code);
      }
    });
  }


  async save() {
    if (this.profileForm.invalid || !this.currentUser) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.profileForm.value;

    this.authService.updateProfile(formValue).pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: async () => {
        const toast = await this.toastCtrl.create({
          message: 'Profile updated successfully.',
          duration: 2000,
          color: 'success'
        });
        await toast.present();
      },
      error: async (err) => {
        console.error('Profile update failed', err);
        const toast = await this.toastCtrl.create({
          message: 'Failed to update profile. Please try again.',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }
    });
  }

  getInitials(fullname: string): string {
    if (!fullname) return '';
    const names = fullname.split(' ').filter(Boolean);
    if (names.length === 0) return '';
    const firstInitial = names[0][0];
    const lastInitial = names.length > 1 ? names[names.length - 1][0] : '';
    return (firstInitial + lastInitial).toUpperCase();
  }

  triggerFileUpload() {
    document.getElementById('profile-pic-upload')?.click();
  }

  async onFileSelected(event: any) {
    const modal = await this.modalCtrl.create({
      component: ImageCropperModalComponent,
      componentProps: {
        imageChangedEvent: event,
        resizeToWidth: 256, // Further reduced width for a smaller file size.
        format: 'jpeg',     // Change format to JPEG for better compression.
        imageQuality: 60    // Set JPEG quality (90 is a good balance).
      }
    });
    await modal.present();

    const { data, role } = await modal.onDidDismiss();
    if (role === 'confirm' && data) {
      this.uploadCroppedImage(data);
    }
  }

  private uploadCroppedImage(imageBlob: Blob) {
    if (!this.currentUser) return;

    this.isUploadingProfilePic.set(true);
    const imageFile = new File([imageBlob], 'profile.jpeg', { type: 'image/jpeg' });
    this.userService.uploadProfilePicture(imageFile).pipe(
      finalize(() => this.isUploadingProfilePic.set(false))
    ).subscribe({
      next: async () => {
        // By updating the timestamp, we force the <img> tag in the template
        // to reload the image from the same URL, bypassing the browser cache.
        this.profilePictureTimestamp.set(Date.now());
        const toast = await this.toastCtrl.create({
          message: 'Profile picture updated.',
          duration: 2000,
          color: 'success'
        });
        await toast.present();
      },
      error: async (err: any) => {
        const toast = await this.toastCtrl.create({
          message: err.error?.message || 'Upload failed. Please try again.',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }
    });
  }

  async connectPersonalAccount() {
    // 1. Verify Identity
    const verified = await this.biometricService.verifyIdentity("Verify identity to connect account");
    if (!verified) return;



    // Manually construct the URL to ensure a consistent server-side flow.
    const clientId = environment.msalConfig.auth.clientId;
    const redirectUri = environment.msalConfig.auth.redirectUri;
    const scope = 'offline_access files.readwrite.all user.read';
    const responseType = 'code';
    const responseMode = 'query'; // Ensures ?code=...
    const state = 'personal_signature_setup';

    const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${clientId}&` +
      `response_type=${responseType}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_mode=${responseMode}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${state}&` +
      `prompt=select_account`;

    window.location.href = url;
  }

  async handleMicrosoftCallback(code: string) {
    const loading = await this.loadingCtrl.create({ message: 'Connecting account...' });
    await loading.present();

    const redirectUri = environment.msalConfig.auth.redirectUri;
    this.userService.connectPersonalMicrosoftAccount(code, redirectUri)
      .pipe(finalize(() => loading.dismiss()))
      .subscribe({
        next: async () => {
          const toast = await this.toastCtrl.create({ message: 'Personal account connected successfully!', duration: 3000, color: 'success' });
          await toast.present();
          // Clear query params
          this.router.navigate([], { relativeTo: this.route, queryParams: {} });
        },
        error: async (err) => {
          const toast = await this.toastCtrl.create({ message: err.error?.message || 'Failed to connect account.', duration: 5000, color: 'danger' });
          await toast.present();
        }
      });
  }

  async triggerSignatureUpload() {

    // 1. Verify Identity
    const verified = await this.biometricService.verifyIdentity("Verify identity to add signature");
    if (!verified) return;


    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Add Signature',
      buttons: [
        {
          text: 'Draw Signature',
          icon: 'create-outline',
          handler: () => this.openSignaturePad()
        },
        {
          text: 'Upload Image',
          icon: 'cloud-upload-outline',
          handler: () => this.signatureUploadInput.nativeElement.click()
        },
        { text: 'Cancel', role: 'cancel' }
      ]
    });
    await actionSheet.present();
  }

  async openSignaturePad() {
    const modal = await this.modalCtrl.create({
      component: SignatureModalComponent,
      backdropDismiss: false,
    });
    await modal.present();

    const { data, role } = await modal.onDidDismiss();

    if (role === 'confirm' && data instanceof Blob) {
      this.uploadSignature(data);
    }
  }


  async onSignatureFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const loading = await this.loadingCtrl.create({ message: 'Processing signature...' });
    await loading.present();

    try {
      // 1. Process the image (Remove background)
      const transparentBlob = await this.imageProcessing.removeBackground(file);
      
      // 2. Upload the processed PNG
      this.uploadSignature(transparentBlob);

    } catch (error) {
      console.error(error);
      const toast = await this.toastCtrl.create({ message: 'Could not process image. Try a clearer photo.', color: 'danger', duration: 3000 });
      await toast.present();
    } finally {
      loading.dismiss();
      input.value = ''; // Reset input
    }
  }

  private uploadSignature(signatureBlob: Blob) {
    this.isUploadingSignature.set(true);
    const signatureFile = new File([signatureBlob], 'signature.png', { type: 'image/png' });

    this.userService.uploadSignature(signatureFile).pipe(
      finalize(() => this.isUploadingSignature.set(false))
    ).subscribe({
      next: async (response: any) => {
        // Force a token refresh, which will trigger the currentUserProfile$ stream
        // in AuthService to refetch the profile from the backend.
        this.loadSignature();
        await this.authService.firebaseUser()?.getIdToken(true);

        const toast = await this.toastCtrl.create({ message: 'Signature secured in OneDrive.', color: 'success', duration: 2000 });
        await toast.present();
      },
      error: async (err) => {
        const toast = await this.toastCtrl.create({ message: err.error?.message || 'Failed to upload signature.', color: 'danger', duration: 3000 });
        await toast.present();
      }
    });
  }

  async removeSignature() {

    // 1. Verify Identity
    const verified = await this.biometricService.verifyIdentity("Verify identity to remove signature");
    if (!verified) return;

    const alert = await this.alertCtrl.create({
      header: 'Remove Signature',
      message: 'Are you sure you want to remove your signature? This will delete the file from your OneDrive.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Remove',
          role: 'destructive',
          handler: () => {
            this.userService.removeSignature().subscribe({
              next: async () => {
                // Optimistic update: Remove the signature URL from the local signal
                const currentUser = this.authService.userProfile();
                if (currentUser) {
                  this.authService.userProfile.set({ ...currentUser, signatureUrl: undefined, signatureItemId: undefined });
                }
                this.signatureUrl.set(null);

                await this.authService.firebaseUser()?.getIdToken(true);
                const toast = await this.toastCtrl.create({ message: 'Signature removed.', color: 'success', duration: 2000 });
                await toast.present();
              },
              error: async (err) => {
                const toast = await this.toastCtrl.create({ message: err.error?.message || 'Failed to remove signature.', color: 'danger', duration: 3000 });
                await toast.present();
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }


  async removePersonalMicrosoftAccount() {

    // 1. Verify Identity
    const verified = await this.biometricService.verifyIdentity("Verify identity to disconnect account");
    if (!verified) return;

    
    const alert = await this.alertCtrl.create({
      header: 'Confirm Removal',
      message: 'Are you sure you want to remove your personal Microsoft account integration? This will disconnect your OneDrive and delete any stored signature image.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Remove',
          role: 'destructive',
          handler: async () => {
            const loading = await this.loadingCtrl.create({ message: 'Removing integration...' });
            await loading.present();
            this.userService.removePersonalMicrosoftAccount().pipe(
              finalize(() => loading.dismiss())
            ).subscribe({
              next: async () => {
                // Fetch the fresh user profile from the server after removal.
                this.userService.getMyProfile().subscribe(freshUser => {
                  // Update the central auth service signal, which will make the UI react.
                  this.authService.userProfile.set(freshUser);
                });
                this.signatureUrl.set(null);

                const toast = await this.toastCtrl.create({ message: 'Personal Microsoft account integration removed.', duration: 3000, color: 'success' });
                await toast.present();
              },
              error: async (err) => {
                const message = err.error?.message || 'Failed to remove personal Microsoft account integration.';
                const toast = await this.toastCtrl.create({ message, duration: 3000, color: 'danger' });
                await toast.present();
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  loadSignature() {
    this.userService.getSignatureImage().subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.signatureUrl.set(this.sanitizer.bypassSecurityTrustUrl(objectUrl));
      },
      error: () => this.signatureUrl.set(null)
    });
  }

}