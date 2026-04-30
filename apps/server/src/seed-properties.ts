/**
 * Seeds the two initial Teddy City Hotels properties:
 *   - Teddy City Hotel, Enugu
 *   - Boneros Creed by Teddy City Hotels
 *
 * Run with:  npx nx run server:seed-properties   (or)   ts-node apps/server/src/seed-properties.ts
 *
 * Idempotent: re-running updates by slug rather than creating duplicates.
 */

import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import { getFirestore } from 'firebase-admin/firestore';
import { IProperty, IUpsertPropertyDto } from '@teddy-city-hotels/shared-interfaces';

dotenv.config({ path: '.env' });

const serviceAccount = {
  type: process.env['FIREBASE_TYPE']!,
  project_id: process.env['FIREBASE_PROJECT_ID']!,
  private_key_id: process.env['FIREBASE_PRIVATE_KEY_ID']!,
  private_key: process.env['FIREBASE_PRIVATE_KEY']!.replace(/\\n/g, '\n'),
  client_email: process.env['FIREBASE_CLIENT_EMAIL']!,
  client_id: process.env['FIREBASE_CLIENT_ID']!,
  auth_uri: process.env['FIREBASE_AUTH_URI']!,
  token_uri: process.env['FIREBASE_TOKEN_URI']!,
  auth_provider_x509_cert_url: process.env['FIREBASE_AUTH_PROVIDER_X509_CERT_URL']!,
  client_x509_cert_url: process.env['FIREBASE_CLIENT_X509_CERT_URL']!,
};

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: serviceAccount.project_id,
  });
  console.log('Firebase Admin SDK initialized for property seeding.');
}

const db = getFirestore('teddycityhotels');

const PROPERTIES: IUpsertPropertyDto[] = [
  {
    slug: 'teddy-city-enugu',
    name: 'Teddy City Hotel',
    shortDescription:
      'Our flagship Enugu property — rooms, kitchen, snooker league, swimming, and the 0421 Club.',
    description:
      'Teddy City Hotel is the flagship property of Teddy City Hotels in Enugu. The hotel combines comfortable rooms with a full leisure programme: a curated kitchen, a competitive snooker league, an oasis pool, conference rooms, and the 0421 Club for nightlife.',
    kind: 'hotel',
    status: 'active',
    branding: {
      displayName: 'Teddy City Hotel, Enugu',
      tagline: 'World-class hospitality, Enugu home.',
      accentColor: '#C9A96E',
      heroImageUrl: 'assets/img/hero-poster.webp',
    },
    address: {
      line1: '123 Teddy City Avenue',
      city: 'Enugu',
      state: 'Enugu',
      country: 'Nigeria',
    },
    geo: { lat: 6.45, lng: 7.5 },
    contact: {
      phone: '+234 800 000 0000',
      email: 'info@teddycityhotel.com',
    },
    features: {
      rooms: true,
      kitchen: true,
      swimming: true,
      snooker: true,
      nightclub: true,
      conference: true,
    },
    gallery: [],
    displayOrder: 1,
  },
  {
    slug: 'boneros-creed',
    name: 'Boneros Creed',
    shortDescription:
      'Boneros Creed by Teddy City Hotels — an upscale stay focused on rest and refined dining.',
    description:
      'Boneros Creed by Teddy City Hotels is the second property in our portfolio. Designed for guests who want quiet, refined hospitality, with a kitchen-led food programme and intimate conference spaces.',
    kind: 'hotel',
    status: 'active',
    branding: {
      displayName: 'Boneros Creed by Teddy City Hotels',
      tagline: 'Refined stays. Quiet luxury.',
      accentColor: '#1F3A5F',
    },
    address: {
      line1: 'Address to be confirmed',
      city: 'Enugu',
      state: 'Enugu',
      country: 'Nigeria',
    },
    contact: {
      email: 'info@teddycityhotel.com',
    },
    features: {
      rooms: true,
      kitchen: true,
      swimming: false,
      snooker: false,
      nightclub: false,
      conference: true,
    },
    gallery: [],
    displayOrder: 2,
  },
];

function toDocData(payload: IUpsertPropertyDto, existing?: IProperty) {
  const now = new Date().toISOString();
  return {
    slug: payload.slug,
    name: payload.name,
    shortDescription: payload.shortDescription,
    description: payload.description,
    kind: payload.kind,
    status: payload.status ?? 'active',
    branding: payload.branding,
    address: payload.address,
    geo: payload.geo,
    contact: payload.contact,
    features: { ...(existing?.features || {}), ...(payload.features || {}) },
    gallery: payload.gallery ?? [],
    externalRef: payload.externalRef,
    displayOrder: payload.displayOrder,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

async function seedProperties() {
  console.log('--- Seeding properties collection ---');
  const collection = db.collection('properties');

  for (const payload of PROPERTIES) {
    const existingSnap = await collection.where('slug', '==', payload.slug).limit(1).get();

    if (existingSnap.empty) {
      const ref = collection.doc();
      await ref.set(toDocData(payload));
      console.log(`  + Created "${payload.slug}" (${ref.id})`);
    } else {
      const doc = existingSnap.docs[0];
      const existing = { id: doc.id, ...doc.data() } as IProperty;
      await doc.ref.set(toDocData(payload, existing), { merge: true });
      console.log(`  ~ Updated "${payload.slug}" (${doc.id})`);
    }
  }

  console.log('Done.');
}

seedProperties().catch((error) => {
  console.error('Property seeding failed:', error);
  process.exit(1);
});
