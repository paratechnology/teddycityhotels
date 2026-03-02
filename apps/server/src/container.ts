import { container } from 'tsyringe';
import { FirestoreService } from './services/firestore.service';

// Keep a minimal container bootstrap so DI has core singletons available.
container.registerSingleton(FirestoreService);

export { container };
