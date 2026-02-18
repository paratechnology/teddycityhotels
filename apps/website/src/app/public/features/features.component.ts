import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // CommonModule includes NgFor, NgClass
import { MaterialModule } from '../../core/services/material.module';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule, MaterialModule, RouterModule], // CommonModule is all we need
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.scss']
})
export class FeaturesComponent {

  // All feature content is now stored in this array
  featuresData = [
    {
      title: 'Intelligent Case Management',
      leadText: 'Never miss a deadline. Track every task, hearing, and client communication from a single, intuitive dashboard. Our smart workflows guide you from intake to resolution.',
      points: [
        'Automated deadline calculations',
        'Customizable task templates',
        'At-a-glance case progress tracking'
      ],
      desktopImageText: 'Desktop+Case+Dashboard',
      mobileImageText: 'Mobile+Tasks',
      imageColor: '3f51b5',
      reverse: false,
      alignMobileLeft: false
    },
    {
      title: 'Secure Client & Document Hub',
      leadText: 'Manage all client interactions and documents in one secure, centralized location. Enjoy bank-level encryption for all your sensitive files and communications.',
      points: [
        'Unlimited cloud document storage',
        'Version control and full-text search',
        'Secure client-facing portal'
      ],
      desktopImageText: 'Desktop+Document+Hub',
      mobileImageText: 'Mobile+Client+Chat',
      imageColor: 'd4af37',
      reverse: true,
      alignMobileLeft: true
    },
    {
      title: 'Effortless Billing & Invoicing',
      leadText: 'Get paid faster. Track every billable minute, generate professional invoices, and integrate with your favorite payment gateways.',
      points: [
        'One-click invoice generation',
        'Multiple currency and retainer support',
        'Integration with Paystack & Stripe'
      ],
      desktopImageText: 'Desktop+Billing',
      mobileImageText: 'Mobile+Timer',
      imageColor: '3f51b5',
      reverse: false,
      alignMobileLeft: false
    },
    {
      title: 'Compliance-Ready Trust Accounting',
      leadText: 'Handle client funds with absolute confidence. Our dedicated trust accounting module ensures you stay compliant with IOLTA/escrow rules, with separate ledgers for every client and matter.',
      points: [
        'Dedicated IOLTA/Escrow management',
        'Individual client trust ledgers',
        'Audit-ready reporting and reconciliation'
      ],
      desktopImageText: 'Desktop+Trust+Ledger',
      mobileImageText: 'Mobile+Trust+Deposit',
      imageColor: '006400',
      reverse: true,
      alignMobileLeft: true
    },
    {
      title: 'Streamline Firm Operations',
      leadText: 'Manage your entire back-office, not just your cases. Run staff payroll, track firm-wide operational expenses, and monitor employee attendance from a single, unified platform.',
      points: [
        'Integrated staff payroll processing',
        'Operational expense tracking and categorization',
        'Employee attendance & time-clock module'
      ],
      desktopImageText: 'Desktop+Firm+Finance+Dash',
      mobileImageText: 'Mobile+Attendance',
      imageColor: '8a2be2',
      reverse: false,
      alignMobileLeft: false
    },
    {
      title: 'Centralized Knowledge Library',
      leadText: 'Build your firm\'s institutional memory. Create a secure, searchable library for internal forms, legal precedents, training materials, and procedural books.',
      points: [
        'Manage internal books and precedents',
        'Version-controlled forms and templates',
        'Reduce research and onboarding time'
      ],
      desktopImageText: 'Desktop+Knowledge+Library',
      mobileImageText: 'Mobile+Precedent+Search',
      imageColor: 'c9640e',
      reverse: true,
      alignMobileLeft: true
    }
  ];

  constructor() {}

  // Updated trackByFn to use a unique property from our new object
  trackByFn(index: number, item: any): string {
    return item.title;
  }
}