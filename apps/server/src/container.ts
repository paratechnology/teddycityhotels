import { container } from 'tsyringe';
import { FirestoreService } from './services/firestore.service';
import { PROPERTY_SOURCE_TOKEN } from './services/property-source.port';
import { FirestorePropertySource } from './services/firestore-property-source';

// Keep a minimal container bootstrap so DI has core singletons available.
container.registerSingleton(FirestoreService);

// Property source — Firestore today; swap to a QuickProHostPropertySource
// here when management is delegated to the QuickProHost API.
container.register(PROPERTY_SOURCE_TOKEN, { useClass: FirestorePropertySource });

export { container };
