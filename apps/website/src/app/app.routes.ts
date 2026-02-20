import { Routes } from '@angular/router';
import { PublicContainerComponent } from './public/public-container.component';
import { ContactComponent } from './public/contact/contact.component';
import { FaqComponent } from './public/faq/faq.component';

// --- ADDED IMPORTS ---
import { PrivacyPolicyComponent } from './public/privacy-policy/privacy-policy.component';
import { TermsOfServiceComponent } from './public/terms-of-service/terms-of-service.component';
import { VerificationComponent } from './public/verification/verification.component';
import { ConfirmDeletionComponent } from './public/confirm-deletion/confirm-deletion.component';
import { RequestDeletionComponent } from './public/request-deletion/request-deletion.component';


// --- NEW HOTEL COMPONENTS ---
import { SnookerComponent } from './public/snooker/snooker.component';
import { SwimmingComponent } from './public/swimming/swimming.component';
import { BookingComponent } from './public/booking/booking.component';

export const routes: Routes = [
  {
    path: '',
    component: PublicContainerComponent
  },
  // Removed legacy "download", "features", "pricing"
  {
    path: 'faq',
    component: FaqComponent
  },
  {
    path: 'contact',
    component: ContactComponent
  },

  // --- HOTEL ROUTES ---
  {
    path: 'snooker',
    component: SnookerComponent
  },
  {
    path: 'swimming',
    component: SwimmingComponent
  },
  {
    path: 'booking',
    component: BookingComponent
  },

  // Add these to your website's routes array:
  {
    path: 'delete-account',
    component: RequestDeletionComponent
  },
  {
    path: 'delete-account-confirm',
    component: ConfirmDeletionComponent
  },
  

  // --- ADDED LEGAL ROUTES ---
  {
    path: 'privacy-policy',
    component: PrivacyPolicyComponent
  },
  {
    path: 'terms-of-service',
    component: TermsOfServiceComponent
  },
  { path: 'verify', component: VerificationComponent },
   // Fallback route 
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
