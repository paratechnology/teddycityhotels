import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ContactInquiryCategory,
  ICreateContactInquiryDto,
  IProperty,
} from '@teddy-city-hotels/shared-interfaces';
import { ContactService } from '../../core/services/contact.service';
import { PropertyContextService } from '../properties/property-context.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent implements OnInit {
  private fb = inject(FormBuilder);
  private contactService = inject(ContactService);
  private propertyContext = inject(PropertyContextService);
  private destroyRef = inject(DestroyRef);

  property: IProperty | null = null;

  ngOnInit(): void {
    this.propertyContext.active$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((property) => {
        this.property = property;
      });
  }

  readonly categories: Array<{ value: ContactInquiryCategory; label: string }> = [
    { value: 'general', label: 'General inquiry' },
    { value: 'booking', label: 'Room booking' },
    { value: 'restaurant', label: 'Kitchen or menu' },
    { value: 'snooker', label: 'Snooker league' },
    { value: 'swimming', label: 'Swimming' },
    { value: 'events', label: 'Meetings or events' },
  ];

  readonly form = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    category: this.fb.nonNullable.control<ContactInquiryCategory>('general', {
      validators: [Validators.required],
    }),
    subject: ['', [Validators.required]],
    message: ['', [Validators.required, Validators.minLength(20)]],
  });

  submitting = false;
  successMessage = '';
  error = '';

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.successMessage = '';
    this.error = '';

    const value = this.form.getRawValue();
    const payload: ICreateContactInquiryDto = {
      name: String(value.name || '').trim(),
      email: String(value.email || '').trim(),
      phone: String(value.phone || '').trim() || undefined,
      category: value.category,
      subject: String(value.subject || '').trim(),
      message: String(value.message || '').trim(),
    };

    this.contactService.sendMessage(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.successMessage = `Your message has been sent to ${this.property?.branding?.displayName || this.property?.name || 'this property'}. Our team will follow up shortly.`;
        this.form.reset({
          name: '',
          email: '',
          phone: '',
          category: 'general',
          subject: '',
          message: '',
        });
      },
      error: (error) => {
        this.submitting = false;
        this.error = error?.error?.message || 'We could not send your message right now.';
      },
    });
  }
}
