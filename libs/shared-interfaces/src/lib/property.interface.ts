/**
 * A Property is a single hotel / shortlet location operated by Teddy City Hotels
 * (the management company). All property-scoped resources (rooms, bookings,
 * kitchen menus, amenities) link back to a property by `propertyId`.
 *
 * The shape is intentionally close to the QuickProHost Property model so this
 * surface can be backed by either Firestore (today) or the QuickProHost API
 * (later) without touching controllers or UI.
 */

export type PropertyStatus = 'active' | 'draft' | 'archived';

export type PropertyKind = 'hotel' | 'shortlet' | 'lodge' | 'resort';

export interface IPropertyContact {
  phone?: string;
  email?: string;
  whatsapp?: string;
}

export interface IPropertyAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
}

export interface IPropertyGeo {
  lat: number;
  lng: number;
}

/**
 * Switches that toggle whole feature-pages on the property's micro-site.
 * Boneros Creed may not have a snooker league, etc. Keep these explicit.
 */
export interface IPropertyFeatureFlags {
  rooms: boolean;
  kitchen: boolean;
  swimming: boolean;
  snooker: boolean;
  nightclub: boolean;
  conference: boolean;
}

export const defaultPropertyFeatureFlags: IPropertyFeatureFlags = {
  rooms: true,
  kitchen: false,
  swimming: false,
  snooker: false,
  nightclub: false,
  conference: false,
};

export interface IPropertyBranding {
  /** Display name used in headers, footers, page titles. */
  displayName: string;
  /** Optional tagline shown under hero on property page. */
  tagline?: string;
  /** Hex colour used as the property's accent. */
  accentColor?: string;
  /** Public URL to the property's logo image. */
  logoUrl?: string;
  /** Public URL to the hero / cover image used on the property page. */
  heroImageUrl?: string;
}

export interface IProperty {
  id: string;
  /** URL slug, e.g. 'teddy-city-enugu', 'boneros-creed'. Unique. */
  slug: string;
  /** Internal name, e.g. 'Teddy City Hotel'. */
  name: string;
  /** Short marketing description for cards and listings. */
  shortDescription: string;
  /** Long-form description for the property's About section. */
  description?: string;
  kind: PropertyKind;
  status: PropertyStatus;
  branding: IPropertyBranding;
  address: IPropertyAddress;
  geo?: IPropertyGeo;
  contact: IPropertyContact;
  features: IPropertyFeatureFlags;
  /** Image URLs for the gallery on the property page. */
  gallery: string[];
  /**
   * Optional handle that maps this property to its record in QuickProHost,
   * once management is delegated. Empty until that integration is wired.
   */
  externalRef?: {
    provider: 'quickprohost';
    propertyId: string;
  };
  /** Order in which to render this property on the corporate "Our Properties" list. */
  displayOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IUpsertPropertyDto {
  slug?: string;
  name: string;
  shortDescription: string;
  description?: string;
  kind: PropertyKind;
  status?: PropertyStatus;
  branding: IPropertyBranding;
  address: IPropertyAddress;
  geo?: IPropertyGeo;
  contact: IPropertyContact;
  features?: Partial<IPropertyFeatureFlags>;
  gallery?: string[];
  externalRef?: {
    provider: 'quickprohost';
    propertyId: string;
  };
  displayOrder?: number;
}
