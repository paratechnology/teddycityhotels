import { Routes } from '@angular/router';
import { PublicContainerComponent } from './public/public-container.component';
import { AcceptInvitationComponent } from './public/accept-invitation/accept-invitation.component';
import { DownloadComponent } from './public/download/download.component';
import { FeaturesComponent } from './public/features/features.component';
import { PricingComponent } from './public/pricing/pricing.component';
import { FaqComponent } from './public/faq/faq.component';
import { ContactComponent } from './public/contact/contact.component';

// --- ADDED IMPORTS ---
import { PrivacyPolicyComponent } from './public/privacy-policy/privacy-policy.component';
import { TermsOfServiceComponent } from './public/terms-of-service/terms-of-service.component';
import { VerificationComponent } from './public/verification/verification.component';
import { GuestSigningComponent } from './public/guest-signing/guest-signing.component';
import { ConfirmDeletionComponent } from './public/confirm-deletion/confirm-deletion.component';
import { RequestDeletionComponent } from './public/request-deletion/request-deletion.component';


export const routes: Routes = [
  {
    path: '',
    component: PublicContainerComponent
  },
  {
    path: 'download',
    component: DownloadComponent
  },
  {
    path: 'accept-invitation',
    component: AcceptInvitationComponent
  },
  {
    path: 'features',
    component: FeaturesComponent
  },
  {
    path: 'pricing',
    component: PricingComponent
  },
  {
    path: 'faq',
    component: FaqComponent
  },
  {
    path: 'contact',
    component: ContactComponent
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
  { path: 'sign', component: GuestSigningComponent },
  // Fallback route 
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];