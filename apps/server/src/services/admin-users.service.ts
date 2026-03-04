import { inject, injectable } from 'tsyringe';
import * as admin from 'firebase-admin';
import {
  AdminModuleAccess,
  defaultAdminModuleAccess,
  IAdminUser,
  ICreateAdminUserDto,
  IUpdateAdminUserDto,
  PaginatedResponse,
} from '@teddy-city-hotels/shared-interfaces';
import { FirestoreService } from './firestore.service';
import { NotFoundError } from '../errors/http-errors';

@injectable()
export class AdminUsersService {
  constructor(@inject(FirestoreService) private firestore: FirestoreService) {}

  private getCollection() {
    return this.firestore.db.collection('adminUsers');
  }

  private normalizePhoneNumber(value?: string): string | undefined {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  }

  private isE164(value: string): boolean {
    return /^\+[1-9]\d{7,14}$/.test(value);
  }

  private resolveAccess(partial?: Partial<AdminModuleAccess>): AdminModuleAccess {
    return {
      ...defaultAdminModuleAccess,
      dashboard: true,
      notifications: true,
      ...(partial || {}),
    };
  }

  async listAdmins(): Promise<IAdminUser[]> {
    const snapshot = await this.getCollection().orderBy('createdAt', 'desc').get();
    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as IAdminUser));
  }

  async listAdminsPaginated(params: {
    page: number;
    pageSize: number;
    search?: string;
  }): Promise<PaginatedResponse<IAdminUser>> {
    const page = Number.isFinite(params.page) ? Math.max(1, params.page) : 1;
    const pageSize = Number.isFinite(params.pageSize)
      ? Math.min(50, Math.max(1, params.pageSize))
      : 12;

    const rows = await this.listAdmins();
    const filtered = params.search?.trim()
      ? rows.filter((row) => {
          const search = params.search?.trim().toLowerCase() || '';
          return (
            row.fullname.toLowerCase().includes(search) ||
            row.email.toLowerCase().includes(search) ||
            (row.phoneNumber || '').toLowerCase().includes(search)
          );
        })
      : rows;

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    return {
      data: filtered.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    };
  }

  async getAdminById(adminId: string): Promise<IAdminUser> {
    const doc = await this.getCollection().doc(adminId).get();
    if (!doc.exists) {
      throw new NotFoundError('Admin user not found.');
    }
    return { id: doc.id, ...doc.data() } as IAdminUser;
  }

  async getAdminByAuthUid(uid: string): Promise<IAdminUser | null> {
    const doc = await this.getCollection().doc(uid).get();
    if (!doc.exists) {
      return null;
    }

    return { id: doc.id, ...doc.data() } as IAdminUser;
  }

  async createAdmin(payload: ICreateAdminUserDto): Promise<IAdminUser> {
    const normalizedPhone = this.normalizePhoneNumber(payload.phoneNumber);
    const createRequest: admin.auth.CreateRequest = {
      email: payload.email.trim(),
      password: payload.temporaryPassword,
      displayName: payload.fullname.trim(),
    };

    // Firebase Auth accepts phoneNumber only in E.164 format.
    if (normalizedPhone && this.isE164(normalizedPhone)) {
      createRequest.phoneNumber = normalizedPhone;
    }

    const authUser = await admin.auth().createUser(createRequest);

    const adminAccess = this.resolveAccess(payload.adminAccess);

    await admin.auth().setCustomUserClaims(authUser.uid, {
      admin: true,
      isSuperAdmin: Boolean(payload.isSuperAdmin),
      adminAccess,
      fullname: payload.fullname,
    });

    const now = new Date().toISOString();
    const adminUser: IAdminUser = {
      id: authUser.uid,
      fullname: payload.fullname.trim(),
      email: payload.email.trim(),
      admin: true,
      isSuperAdmin: Boolean(payload.isSuperAdmin),
      active: true,
      adminAccess,
      fcmTokens: [],
      createdAt: now,
      updatedAt: now,
    };

    if (normalizedPhone) {
      adminUser.phoneNumber = normalizedPhone;
    }

    await this.getCollection().doc(authUser.uid).set(adminUser);

    return adminUser;
  }

  async updateAdmin(adminId: string, payload: IUpdateAdminUserDto): Promise<IAdminUser> {
    const existing = await this.getAdminById(adminId);
    const adminAccess = payload.adminAccess
      ? this.resolveAccess({ ...existing.adminAccess, ...payload.adminAccess })
      : existing.adminAccess;

    const updates: Record<string, unknown> = {
      fullname: payload.fullname?.trim() || existing.fullname,
      active: payload.active ?? existing.active,
      isSuperAdmin: payload.isSuperAdmin ?? existing.isSuperAdmin,
      adminAccess,
      updatedAt: new Date().toISOString(),
    };

    if (payload.phoneNumber !== undefined) {
      const normalizedPhone = this.normalizePhoneNumber(payload.phoneNumber);
      updates['phoneNumber'] = normalizedPhone ?? admin.firestore.FieldValue.delete();
    }

    await this.getCollection().doc(adminId).set(updates, { merge: true });

    await admin.auth().setCustomUserClaims(adminId, {
      admin: true,
      isSuperAdmin: Boolean(updates['isSuperAdmin']),
      adminAccess,
      fullname: String(updates['fullname'] || existing.fullname),
    });

    return this.getAdminById(adminId);
  }
}
