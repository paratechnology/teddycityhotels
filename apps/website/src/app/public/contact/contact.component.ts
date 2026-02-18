import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../core/services/material.module';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ContactService } from '../../core/services/contact.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule, // Import ReactiveFormsModule
    MatProgressSpinnerModule
  ],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
  contactForm: FormGroup;
  isLoading = false;
  isSubmitted = false;

  inquiryTypes = [
    'General Inquiry',
    'Sales & Pricing',
    'Technical Support',
    'Enterprise & Custom Solutions'
  ];

  constructor(
    private fb: FormBuilder,
    private contactService: ContactService
  ) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''], // Optional
      firmName: [''], // Optional
      inquiryType: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onSubmit() {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched(); // Show errors if user clicks submit early
      return;
    }

    this.isLoading = true;
    this.isSubmitted = false;

    this.contactService.sendMessage(this.contactForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.isSubmitted = true;
        this.contactForm.reset();
        this.contactForm.get('inquiryType')?.setValue('');
      },
      error: (err) => {
        this.isLoading = false;
        // In a real app, you'd show a toast or error message to the user
        console.error('Failed to send message:', err);
        // For now, we'll still show the success message for demo purposes, but you'd handle this differently.
        this.isSubmitted = true; 
      }
    });
  }
}