import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import { getFirestore } from 'firebase-admin/firestore';
import { ROOMS_DATA } from '../../website/src/app/public/rooms/rooms.data';

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
  console.log('Firebase Admin SDK initialized for seeding script.');
}

const db = getFirestore('teddycityhotels');

async function seedRooms() {
  console.log('--- Seeding rooms collection ---');
  const roomsCollection = db.collection('rooms');
  const batch = db.batch();

  for (const room of ROOMS_DATA) {
    const docRef = roomsCollection.doc(room.id);
    batch.set(docRef, room);
  }

  await batch.commit();
  console.log(`Successfully seeded ${ROOMS_DATA.length} rooms.`);
}

seedRooms().catch((error) => {
  console.error('Seeding failed:', error);
});
