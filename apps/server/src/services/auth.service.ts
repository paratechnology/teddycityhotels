import { inject, injectable } from 'tsyringe';
import { FirestoreService } from './firestore.service';
import { AcceptInvitationDto, IAuthResponse, IFirmUser } from '@teddy-city-hotels/shared-interfaces';
import axios from 'axios';
import firebaseAdmin from 'firebase-admin';
import { BadRequestError, UnauthorizedError } from '../errors/http-errors';

@injectable()
export class AuthService {
  constructor(@inject(FirestoreService) private firestore: FirestoreService) {}

  async adminLogin(email: string, password: string): Promise<{ token: string; user: any }> {
    if (!email || !password) {
      throw new BadRequestError('Email and password are required.');
    }

    const apiKey = process.env['FIREBASE_API_KEY'];
    if (!apiKey) {
      throw new BadRequestError('FIREBASE_API_KEY is not configured.');
    }

    const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

    let idToken = '';
    try {
      const response = await axios.post(endpoint, {
        email,
        password,
        returnSecureToken: true,
      });

      console.log('Firebase Auth Response:', response.data);
      idToken = response.data.idToken as string;
    } catch (_error) {

      throw new UnauthorizedError('Invalid email or password.');
    }

    const decoded = await firebaseAdmin.auth().verifyIdToken(idToken);
    const isAdmin = Boolean(decoded['admin'] || decoded['isSuperAdmin']);
    if (!isAdmin) {
      throw new UnauthorizedError('Admin access required.');
    }

    const adminDoc = await this.firestore.db.collection('adminUsers').doc(decoded.uid).get();
    const adminUser = adminDoc.exists
      ? adminDoc.data()
      : {
          id: decoded.uid,
          fullname: decoded['fullname'] || decoded['name'] || '',
          email: decoded.email || '',
          admin: Boolean(decoded['admin']),
          isSuperAdmin: Boolean(decoded['isSuperAdmin']),
          adminAccess: decoded['adminAccess'] || {},
        };

        console.log('Admin User:', adminUser)
    return {
      token: idToken,
      user: adminUser,
    };
  }

  async registerInvitedUser(firmId: string, dto: AcceptInvitationDto): Promise<IAuthResponse> {
    const usersRef = this.firestore.db.collection('firms').doc(firmId).collection('users');
    const userRef = usersRef.doc();
    const fullname = `${dto.firstName} ${dto.lastName}`.trim();

    const user: IFirmUser = {
      id: userRef.id,
      firmId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      otherNames: dto.otherNames,
      fullname,
      email: `${userRef.id}@example.com`,
      designation: 'Admin',
      admin: true,
      active: true,
      isSuperAdmin: false,
      roles: {
        canMatter: false,
        canBill: false,
        canSchedule: false,
        fileManager: false,
        librarian: false,
        canAssign: false,
      },
      fcmTokens: [],
      passwordResetToken: '',
      passwordResetTokenExpires: '',
      createdAt: new Date().toISOString(),
    };

    await userRef.set(user);

    return {
      success: true,
      message: 'Invitation accepted.',
      user,
      token: '',
    };
  }

  async updateMyProfile(userId: string, firmId: string, updateData: Partial<IFirmUser>): Promise<IFirmUser> {
    const ref = this.firestore.db.collection('firms').doc(firmId).collection('users').doc(userId);
    await ref.set(updateData, { merge: true });
    const updated = await ref.get();
    return updated.data() as IFirmUser;
  }

  async requestPasswordReset(email: string): Promise<void> {
    return;
  }

  async resetPasswordWithCode(email: string, code: string, newPassword: string): Promise<void> {
    return;
  }
}
