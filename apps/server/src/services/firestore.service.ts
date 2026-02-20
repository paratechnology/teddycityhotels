import { injectable, singleton } from 'tsyringe';
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";

@injectable()
@singleton()
export class FirestoreService {
  public readonly db: FirebaseFirestore.Firestore;
  public readonly storage: Storage;

  constructor() {
    if (admin.apps.length > 0) {
      this.db = getFirestore();
      this.storage = getStorage(admin.app());
      return;
    }

    this.validateEnvVars();

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

    try {
      const app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: serviceAccount.project_id,
        storageBucket: `${serviceAccount.project_id}.appspot.com`,
      });

      console.log("✅ Firebase Admin SDK initialized successfully by FirestoreService.");
      this.db = getFirestore(app, 'quickprolaw');
      this.storage = getStorage(app);
    } catch (error) {
      console.error("❌ Error initializing Firebase Admin SDK:", error);
      process.exit(1);
    }
  }

  private validateEnvVars() {
    const required = [
      "FIREBASE_TYPE", "FIREBASE_PROJECT_ID", "FIREBASE_PRIVATE_KEY_ID",
      "FIREBASE_PRIVATE_KEY", "FIREBASE_CLIENT_EMAIL", "FIREBASE_CLIENT_ID",
      "FIREBASE_AUTH_URI", "FIREBASE_TOKEN_URI", "FIREBASE_AUTH_PROVIDER_X509_CERT_URL",
      "FIREBASE_CLIENT_X509_CERT_URL",
    ];

    // Initialize the app only if it hasn't been initialized yet.
    for (const key of required) {
      if (!process.env[key]) {
        console.error(`Missing environment variable: ${key}`);
        process.exit(1);
      }
    }
  }
}
