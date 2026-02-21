import { inject, injectable } from 'tsyringe';
import { Room } from '@teddy-city-hotels/shared-interfaces';
import { FirestoreService } from './firestore.service';
import { NotFoundError } from '../errors/http-errors';

@injectable()
export class RoomService {
  constructor(@inject(FirestoreService) private firestore: FirestoreService) {}

  private getRoomsCollection() {
    return this.firestore.db.collection('rooms');
  }

  async getAllRooms(): Promise<Room[]> {
    const snapshot = await this.getRoomsCollection().orderBy('price').get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
  }

  async getRoomById(roomId: string): Promise<Room> {
    const doc = await this.getRoomsCollection().doc(roomId).get();
    if (!doc.exists) {
      throw new NotFoundError(`Room with ID "${roomId}" not found.`);
    }
    return { id: doc.id, ...doc.data() } as Room;
  }
}
