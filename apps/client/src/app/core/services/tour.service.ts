import { Injectable, inject } from '@angular/core';
import { driver, DriveStep } from 'driver.js';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class TourService {
  private userService = inject(UserService);

  /**
   * Starts a tour with robust element checking.
   */
  async startTour(tourId: string, steps: DriveStep[], force = false) {
    const user = this.userService.currentUser();
    if (!user) return;

    // 1. Check if user has seen it (unless forcing)
    if (!force && user.seenTours?.includes(tourId)) {
      console.log(`[Tour] Skipped '${tourId}' (Already seen)`);
      return; 
    }

    // 2. Validate which elements effectively exist in the DOM right now
    const activeSteps: DriveStep[] = [];
    
    // console.group(`[Tour] Starting '${tourId}'`);
    
    steps.forEach((step, index) => {
      // Steps without elements (like Welcome Modals) are always valid
      if (!step.element) {
        activeSteps.push(step);
        return;
      }

      // Check if the element exists in the document
      const el = document.querySelector(step.element as string);
      if (el) {
        console.log(`✅ Step ${index}: Found element ${step.element}`);
        activeSteps.push(step);
      } else {
        console.warn(`❌ Step ${index}: Element ${step.element} NOT FOUND. Removing step.`);
      }
    });

    if (activeSteps.length === 0) {
      console.error('[Tour] No valid steps found. Aborting.');
      console.groupEnd();
      return;
    }

    // 3. Create a FRESH driver instance every time to avoid state corruption
    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      popoverClass: 'driverjs-theme',
      doneBtnText: 'Got it',
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      onDestroyStarted: () => {
        // Mark as seen when tour closes
        this.userService.markTourAsSeen(tourId); 
        driverObj.destroy();
      }
    });

    // 4. Drive
    driverObj.setSteps(activeSteps);
    driverObj.drive();
    console.groupEnd();
  }
}