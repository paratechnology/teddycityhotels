import { inject, injectable } from 'tsyringe';
import { PaginatedResponse, Room, UpsertRoomDto } from '@teddy-city-hotels/shared-interfaces';
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

  async getAdminRoomsPaginated(params: {
    page: number;
    pageSize: number;
    search?: string;
    type?: Room['type'];
    isAvailable?: boolean;
  }): Promise<PaginatedResponse<Room>> {
    const page = Number.isFinite(params.page) ? Math.max(1, params.page) : 1;
    const pageSize = Number.isFinite(params.pageSize)
      ? Math.min(50, Math.max(1, params.pageSize))
      : 12;

    let query: FirebaseFirestore.Query = this.getRoomsCollection().orderBy('price');
    if (params.type) {
      query = query.where('type', '==', params.type);
    }
    if (params.isAvailable !== undefined) {
      query = query.where('availability.isAvailable', '==', params.isAvailable);
    }

    const snapshot = await query.get();
    let rooms = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Room));

    if (params.search?.trim()) {
      const search = params.search.trim().toLowerCase();
      rooms = rooms.filter((room) => {
        return (
          room.name.toLowerCase().includes(search) ||
          (room.roomNumber || '').toLowerCase().includes(search) ||
          room.type.toLowerCase().includes(search) ||
          room.slug.toLowerCase().includes(search)
        );
      });
    }

    const total = rooms.length;
    const start = (page - 1) * pageSize;
    const data = rooms.slice(start, start + pageSize);

    return {
      data,
      total,
      page,
      pageSize,
    };
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

    await ref.set({
      ...room,
      nameLowercase: room.name.toLowerCase(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
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

    await this.getRoomsCollection().doc(roomId).set(
      {
        ...next,
        nameLowercase: next.name.toLowerCase(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
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
