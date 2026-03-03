import { inject, injectable } from 'tsyringe';
import { FirestoreService } from './firestore.service';
import { AcceptInvitationDto, IAuthResponse, IFirmUser } from '@teddy-city-hotels/shared-interfaces';
import axios from 'axios';
import firebaseAdmin from 'firebase-admin';
import { BadRequestError, UnauthorizedError } from '../errors/http-errors';
import crypto from 'crypto';
import { Resend } from 'resend';

@injectable()
export class AuthService {
  constructor(@inject(FirestoreService) private firestore: FirestoreService) {}

  private resetCollection() {
    return this.firestore.db.collection('adminUsers');
  }

  private generateResetCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private hashResetCode(email: string, code: string): string {
    const secret = process.env['JWT_SECRET'] || process.env['COOKIE_SECRET'] || 'teddycityhotels';
    return crypto.createHash('sha256').update(`${email}:${code}:${secret}`).digest('hex');
  }

  private parseExpiry(value: unknown): Date | null {
    if (!value) return null;

    if (value instanceof Date) return value;

    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    if (
      typeof value === 'object' &&
      value !== null &&
      'toDate' in value &&
      typeof (value as { toDate?: () => Date }).toDate === 'function'
    ) {
      const parsed = (value as { toDate: () => Date }).toDate();
      return parsed instanceof Date ? parsed : null;
    }

    return null;
  }

  private async getAdminAuthUserByEmail(email: string): Promise<firebaseAdmin.auth.UserRecord | null> {
    try {
      const user = await firebaseAdmin.auth().getUserByEmail(email);
      const claims = user.customClaims || {};

      const adminDoc = await this.resetCollection().doc(user.uid).get();
      const adminData = adminDoc.exists ? (adminDoc.data() as { admin?: boolean; isSuperAdmin?: boolean }) : null;
      const isAdmin = Boolean(
        claims['admin'] ||
          claims['isSuperAdmin'] ||
          adminData?.admin ||
          adminData?.isSuperAdmin
      );

      return isAdmin ? user : null;
    } catch (error: any) {
      if (error?.code === 'auth/user-not-found') {
        return null;
      }
      throw error;
    }
  }

  private async sendPasswordResetCode(email: string, code: string): Promise<void> {
    const apiKey = process.env['RESEND_API_KEY'];
    if (!apiKey) {
      console.warn(`RESEND_API_KEY is not configured. Admin reset code for ${email}: ${code}`);
      return;
    }

    const resend = new Resend(apiKey);
    const appName = process.env['APP_NAME'] || 'Teddy City Hotels';
    const from = process.env['RESEND_FROM_EMAIL'] || 'Teddy City Hotels <onboarding@resend.dev>';

    try {
      await resend.emails.send({
        from,
        to: [email],
        subject: `${appName} password reset code`,
        html: `
          <p>Hello,</p>
          <p>Your ${appName} admin password reset code is:</p>
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${code}</p>
          <p>This code expires in 15 minutes.</p>
        `,
      });
    } catch (error) {
      console.error('Failed to send admin password reset code email:', error);
      console.warn(`Fallback admin reset code for ${email}: ${code}`);
    }
  }

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

        // console.log('Admin User:', adminUser)
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
    if (!email) {
      throw new BadRequestError('Email is required.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const adminUser = await this.getAdminAuthUserByEmail(normalizedEmail);

    // Silent success for unknown/non-admin users to avoid account enumeration.
    if (!adminUser) {
      return;
    }

    const resetCode = this.generateResetCode();
    const resetTokenHash = this.hashResetCode(normalizedEmail, resetCode);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const nowIso = new Date().toISOString();
    const claims = adminUser.customClaims || {};

    await this.resetCollection().doc(adminUser.uid).set(
      {
        email: normalizedEmail,
        fullname: adminUser.displayName || '',
        admin: Boolean(claims['admin']),
        isSuperAdmin: Boolean(claims['isSuperAdmin']),
        passwordResetToken: resetTokenHash,
        passwordResetTokenExpires: expiresAt.toISOString(),
        updatedAt: nowIso,
      },
      { merge: true }
    );

    await this.sendPasswordResetCode(normalizedEmail, resetCode);
  }

  async resetPasswordWithCode(email: string, code: string, newPassword: string): Promise<void> {
    if (!email || !code || !newPassword) {
      throw new BadRequestError('Email, code, and new password are required.');
    }

    if (newPassword.length < 6) {
      throw new BadRequestError('Password must be at least 6 characters.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim();
    const adminUser = await this.getAdminAuthUserByEmail(normalizedEmail);
    if (!adminUser) {
      throw new UnauthorizedError('Invalid or expired reset code.');
    }

    const adminDoc = await this.resetCollection().doc(adminUser.uid).get();
    const adminData = adminDoc.exists
      ? (adminDoc.data() as { passwordResetToken?: string; passwordResetTokenExpires?: unknown })
      : null;

    const tokenHash = adminData?.passwordResetToken;
    const expiresAt = this.parseExpiry(adminData?.passwordResetTokenExpires);
    const expectedHash = this.hashResetCode(normalizedEmail, normalizedCode);

    if (!tokenHash || !expiresAt || Date.now() > expiresAt.getTime() || tokenHash !== expectedHash) {
      throw new UnauthorizedError('Invalid or expired reset code.');
    }

    await firebaseAdmin.auth().updateUser(adminUser.uid, { password: newPassword });
    await firebaseAdmin.auth().revokeRefreshTokens(adminUser.uid);

    await this.resetCollection().doc(adminUser.uid).set(
      {
        passwordResetToken: firebaseAdmin.firestore.FieldValue.delete(),
        passwordResetTokenExpires: firebaseAdmin.firestore.FieldValue.delete(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }
}
