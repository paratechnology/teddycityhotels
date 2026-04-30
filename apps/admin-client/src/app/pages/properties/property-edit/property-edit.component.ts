import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  IProperty,
  IUpsertPropertyDto,
  defaultPropertyFeatureFlags,
} from '@teddy-city-hotels/shared-interfaces';
import { PropertyService } from '../../../services/property.service';

@Component({
  selector: 'app-property-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './property-edit.component.html',
  styleUrls: ['./property-edit.component.scss'],
})
export class PropertyEditComponent implements OnInit {
  propertyForm!: FormGroup;
  isEditMode = false;
  propertyId: string | null = null;
  error = '';
  saving = false;

  constructor(
    private fb: FormBuilder,
    private propertyService: PropertyService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.propertyId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.propertyId;

    this.propertyForm = this.fb.group({
      name: ['', Validators.required],
      slug: [''],
      shortDescription: ['', Validators.required],
      description: [''],
      kind: ['hotel', Validators.required],
      status: ['draft', Validators.required],
      displayOrder: [0],
      branding: this.fb.group({
        displayName: ['', Validators.required],
        tagline: [''],
        accentColor: ['#1f4d8c'],
        logoUrl: [''],
        heroImageUrl: [''],
      }),
      address: this.fb.group({
        line1: ['', Validators.required],
        line2: [''],
        city: ['', Validators.required],
        state: [''],
        country: ['Nigeria', Validators.required],
        postalCode: [''],
      }),
      contact: this.fb.group({
        phone: [''],
        email: [''],
        whatsapp: [''],
      }),
      geo: this.fb.group({
        lat: [null],
        lng: [null],
      }),
      features: this.fb.group({
        rooms: [defaultPropertyFeatureFlags.rooms],
        kitchen: [defaultPropertyFeatureFlags.kitchen],
        swimming: [defaultPropertyFeatureFlags.swimming],
        snooker: [defaultPropertyFeatureFlags.snooker],
        nightclub: [defaultPropertyFeatureFlags.nightclub],
        conference: [defaultPropertyFeatureFlags.conference],
      }),
      galleryText: [''],
    });

    if (this.isEditMode && this.propertyId) {
      this.propertyService.get(this.propertyId).subscribe({
        next: (property) => this.patchProperty(property),
        error: (error) => {
          this.error = error?.error?.message || 'Failed to load property.';
        },
      });
    }
  }

  onSubmit(): void {
    if (this.propertyForm.invalid) {
      this.propertyForm.markAllAsTouched();
      return;
    }

    const value = this.propertyForm.getRawValue();

    const gallery: string[] = (value.galleryText || '')
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => !!line);

    const slug = (value.slug || '').trim() || this.slugify(value.name);

    const geoLat = value.geo?.lat;
    const geoLng = value.geo?.lng;
    const hasGeo = geoLat !== null && geoLat !== '' && geoLng !== null && geoLng !== '';

    const payload: IUpsertPropertyDto = {
      name: value.name,
      slug,
      shortDescription: value.shortDescription,
      description: value.description || undefined,
      kind: value.kind,
      status: value.status,
      displayOrder: value.displayOrder !== null && value.displayOrder !== '' ? Number(value.displayOrder) : undefined,
      branding: {
        displayName: value.branding.displayName,
        tagline: value.branding.tagline || undefined,
        accentColor: value.branding.accentColor || undefined,
        logoUrl: value.branding.logoUrl || undefined,
        heroImageUrl: value.branding.heroImageUrl || undefined,
      },
      address: {
        line1: value.address.line1,
        line2: value.address.line2 || undefined,
        city: value.address.city,
        state: value.address.state || undefined,
        country: value.address.country,
        postalCode: value.address.postalCode || undefined,
      },
      contact: {
        phone: value.contact.phone || undefined,
        email: value.contact.email || undefined,
        whatsapp: value.contact.whatsapp || undefined,
      },
      features: value.features,
      gallery,
    };

    if (hasGeo) {
      payload.geo = { lat: Number(geoLat), lng: Number(geoLng) };
    }

    this.saving = true;
    this.error = '';

    const request$ =
      this.isEditMode && this.propertyId
        ? this.propertyService.update(this.propertyId, payload)
        : this.propertyService.create(payload);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/properties']);
      },
      error: (error) => {
        this.saving = false;
        this.error =
          error?.error?.message ||
          (this.isEditMode ? 'Failed to update property.' : 'Failed to create property.');
      },
    });
  }

  private patchProperty(property: IProperty): void {
    this.propertyForm.patchValue({
      name: property.name,
      slug: property.slug,
      shortDescription: property.shortDescription,
      description: property.description || '',
      kind: property.kind,
      status: property.status,
      displayOrder: property.displayOrder ?? 0,
      branding: {
        displayName: property.branding?.displayName || '',
        tagline: property.branding?.tagline || '',
        accentColor: property.branding?.accentColor || '#1f4d8c',
        logoUrl: property.branding?.logoUrl || '',
        heroImageUrl: property.branding?.heroImageUrl || '',
      },
      address: {
        line1: property.address?.line1 || '',
        line2: property.address?.line2 || '',
        city: property.address?.city || '',
        state: property.address?.state || '',
        country: property.address?.country || 'Nigeria',
        postalCode: property.address?.postalCode || '',
      },
      contact: {
        phone: property.contact?.phone || '',
        email: property.contact?.email || '',
        whatsapp: property.contact?.whatsapp || '',
      },
      geo: {
        lat: property.geo?.lat ?? null,
        lng: property.geo?.lng ?? null,
      },
      features: {
        rooms: property.features?.rooms ?? defaultPropertyFeatureFlags.rooms,
        kitchen: property.features?.kitchen ?? defaultPropertyFeatureFlags.kitchen,
        swimming: property.features?.swimming ?? defaultPropertyFeatureFlags.swimming,
        snooker: property.features?.snooker ?? defaultPropertyFeatureFlags.snooker,
        nightclub: property.features?.nightclub ?? defaultPropertyFeatureFlags.nightclub,
        conference: property.features?.conference ?? defaultPropertyFeatureFlags.conference,
      },
      galleryText: (property.gallery || []).join('\n'),
    });
  }

  private slugify(value: string): string {
    return (value || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
}
