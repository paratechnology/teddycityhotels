import { inject, injectable } from 'tsyringe';
import { Room, UpsertRoomDto } from '@teddy-city-hotels/shared-interfaces';
import { FirestoreService } from './firestore.service';
import { NotFoundError } from '../errors/http-errors';

@injectable()
export class RoomService {
  constructor(@inject(FirestoreService) private firestore: FirestoreService) {}

  private getRoomsCollection() {
    return this.firestore.db.collection('rooms');
  }

  private getBookingsCollection() {
    return this.firestore.db.collection('bookings');
  }

  private toSlug(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  async getAllRooms(): Promise<Room[]> {
    const snapshot = await this.getRoomsCollection().orderBy('price').get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Room));
  }

  async getRoomById(roomId: string): Promise<Room> {
    const doc = await this.getRoomsCollection().doc(roomId).get();
    if (!doc.exists) {
      throw new NotFoundError(`Room with ID "${roomId}" not found.`);
    }
    return { id: doc.id, ...doc.data() } as Room;
  }

  async createRoom(payload: UpsertRoomDto): Promise<Room> {
    const ref = this.getRoomsCollection().doc();
    const room: Room = {
      id: ref.id,
      name: payload.name,
      slug: payload.slug || this.toSlug(payload.name),
      roomNumber: payload.roomNumber,
      description: payload.description,
      type: payload.type,
      maxOccupancy: payload.maxOccupancy,
      beds: payload.beds || [],
      price: payload.price,
      amenities: payload.amenities || [],
      images: payload.images || [],
      availability: payload.availability || { isAvailable: true },
      features: payload.features || [],
    };

    await ref.set(room);
    return room;
  }

  async updateRoom(roomId: string, payload: UpsertRoomDto): Promise<Room> {
    const existing = await this.getRoomById(roomId);

    const next: Room = {
      ...existing,
      ...payload,
      id: roomId,
      slug: payload.slug || this.toSlug(payload.name || existing.name),
      availability: payload.availability || existing.availability || { isAvailable: true },
      amenities: payload.amenities || existing.amenities || [],
      beds: payload.beds || existing.beds || [],
      images: payload.images || existing.images || [],
      features: payload.features || existing.features || [],
    };

    await this.getRoomsCollection().doc(roomId).set(next, { merge: true });
    return next;
  }

  async deleteRoom(roomId: string): Promise<void> {
    await this.getRoomById(roomId);
    await this.getRoomsCollection().doc(roomId).delete();
  }

  async syncRoomAvailability(roomId: string): Promise<void> {
    const roomRef = this.getRoomsCollection().doc(roomId);
    const roomDoc = await roomRef.get();
    if (!roomDoc.exists) {
      return;
    }

    const activeStatuses = ['pending', 'confirmed', 'checked_in'];
    const bookingsSnapshot = await this.getBookingsCollection()
      .where('roomId', '==', roomId)
      .where('status', 'in', activeStatuses)
      .limit(1)
      .get();

    const isAvailable = bookingsSnapshot.empty;
    await roomRef.set({ availability: { isAvailable } }, { merge: true });
  }

  async syncAllRoomAvailability(): Promise<void> {
    const rooms = await this.getAllRooms();
    await Promise.all(rooms.map((room) => this.syncRoomAvailability(room.id)));
  }
}
