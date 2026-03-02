import { inject, injectable } from 'tsyringe';
import * as admin from 'firebase-admin';
import {
  AdminModuleAccess,
  defaultAdminModuleAccess,
  IAdminUser,
  ICreateAdminUserDto,
  IUpdateAdminUserDto,
} from '@teddy-city-hotels/shared-interfaces';
import { FirestoreService } from './firestore.service';
import { NotFoundError } from '../errors/http-errors';

@injectable()
export class AdminUsersService {
  constructor(@inject(FirestoreService) private firestore: FirestoreService) {}

  private getCollection() {
    return this.firestore.db.collection('adminUsers');
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
    const authUser = await admin.auth().createUser({
      email: payload.email,
      password: payload.temporaryPassword,
      displayName: payload.fullname,
      phoneNumber: payload.phoneNumber,
    });

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
      fullname: payload.fullname,
      email: payload.email,
      phoneNumber: payload.phoneNumber,
      admin: true,
      isSuperAdmin: Boolean(payload.isSuperAdmin),
      active: true,
      adminAccess,
      fcmTokens: [],
      createdAt: now,
      updatedAt: now,
    };

    await this.getCollection().doc(authUser.uid).set(adminUser);

    return adminUser;
  }

  async updateAdmin(adminId: string, payload: IUpdateAdminUserDto): Promise<IAdminUser> {
    const existing = await this.getAdminById(adminId);
    const adminAccess = payload.adminAccess
      ? this.resolveAccess({ ...existing.adminAccess, ...payload.adminAccess })
      : existing.adminAccess;

    const updates: Partial<IAdminUser> = {
      fullname: payload.fullname ?? existing.fullname,
      phoneNumber: payload.phoneNumber ?? existing.phoneNumber,
      active: payload.active ?? existing.active,
      isSuperAdmin: payload.isSuperAdmin ?? existing.isSuperAdmin,
      adminAccess,
      updatedAt: new Date().toISOString(),
    };

    await this.getCollection().doc(adminId).set(updates, { merge: true });

    await admin.auth().setCustomUserClaims(adminId, {
      admin: true,
      isSuperAdmin: updates.isSuperAdmin,
      adminAccess,
      fullname: updates.fullname,
    });

    return this.getAdminById(adminId);
  }
}
