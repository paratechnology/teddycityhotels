// apps/client/src/app/core/services/app-update.service.ts
import { Injectable, inject } from '@angular/core';
import { doc, getDoc, Firestore } from '@angular/fire/firestore';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

// ---- Live Updates: import the individual functions ----
import {
  sync as liveUpdateSync,
  reload as liveUpdateReload,
} from '@capacitor/live-updates';

import { ModalController } from '@ionic/angular/standalone';
import { UpdateModalComponent } from '../../shared/components/update-modal/update-modal.component';

/* -------------------------------------------------------------------------- */
/*  Firestore document shape                                                  */
/* -------------------------------------------------------------------------- */
export type ILatestVersion = {
  versionCode: number;
  releaseDate: string;
  apkUrl?: string;
  releaseNotes?: string;
};

/* -------------------------------------------------------------------------- */
@Injectable({
  providedIn: 'root',
})
export class AppUpdateService {
  private readonly firestore = inject(Firestore);
  private readonly modalCtrl = inject(ModalController);

  // constructor() {}

  /* ---------------------------------------------------------------------- */
  /*  Public entry point – call wherever you want to check for updates      */
  /* ---------------------------------------------------------------------- */
  async checkForUpdates(): Promise<void> {
    const platform = Capacitor.getPlatform();

    try {
      /* --------------------------------------------------------------- */
      /*  1. Ionic Appflow Live Updates (iOS / Android / Web)            */
      /* --------------------------------------------------------------- */
      if (['ios', 'android', 'web'].includes(platform)) {
        console.log('[LiveUpdate] Checking for web/appflow updates...');
        const result = await liveUpdateSync();

        if (result.activeApplicationPathChanged) {
          console.log('[LiveUpdate] Update found → reloading app');
          await liveUpdateReload();
          return; // app reloads, stop execution
        } else {
          console.log('[LiveUpdate] No live update available');
        }
      }

      /* --------------------------------------------------------------- */
      /*  2. Store Update check (Android / iOS)                          */
      /* --------------------------------------------------------------- */
      if (platform === 'android' || platform === 'ios') {
        await this.checkStoreUpdate(platform);
      }
    } catch (err) {
      console.error('[AppUpdateService] checkForUpdates error:', err);
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  Store update – reads Firestore and shows modal if newer version       */
  /* ---------------------------------------------------------------------- */
  private async checkStoreUpdate(platform: string): Promise<void> {
    try {
      const versionDocRef = doc(this.firestore, 'defaults/app-version');
      const versionDoc = await getDoc(versionDocRef);
      if (!versionDoc.exists()) return;

      const latest = versionDoc.data()?.[platform] as ILatestVersion | undefined;
      if (!latest?.versionCode) return;

      const info = await App.getInfo();
      const currentBuild = parseInt(info.build || '0', 10);

      if (latest.versionCode > currentBuild) {
        await this.presentUpdateModal(latest, platform);
      }
    } catch (err) {
      console.error('[AppUpdateService] checkStoreUpdate error:', err);
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  Show non-dismissable modal with release notes + “Update Now” button   */
  /* ---------------------------------------------------------------------- */
  private async presentUpdateModal(latest: ILatestVersion, platform: string): Promise<void> {
    console.log('New version available:', latest);
    const modal = await this.modalCtrl.create({
      component: UpdateModalComponent,
      componentProps: {
        releaseNotes:
          latest.releaseNotes ??
          `
          Bug fixes and feature update.<br>
          Release date: ${latest.releaseDate ?? 'Unknown'}<br>
          Version: ${latest.versionCode ?? 'Unknown'}
        `,
      },
      backdropDismiss: false,
      keyboardClose: false,
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (data === 'update') {
      this.openStore(platform);
    }
  }

  private openStore(platform: string) {
    if (platform === 'android') {
      window.open('https://play.google.com/store/apps/details?id=com.quickprolaw.android', '_system');
    } else if (platform === 'ios') {
      // TODO: Add iOS App Store URL when available (e.g. https://apps.apple.com/app/id<APP_ID>)
      console.log('Open App Store for iOS');
    }
  }
}