import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { AuthService } from '../services/auth.service';
import firebaseAdmin from 'firebase-admin';
import { FirestoreService } from '../services/firestore.service';
import { AcceptInvitationDto, IAuthResponse, IFirmUser, IRegisterFirm, IUserIndex } from '@teddy-city-hotels/shared-interfaces';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../errors/http-errors';
import HttpStatusCodes from '../constants/HttpStatusCodes';
import { FirmService } from '../services/firm.service';

@injectable()
export class AuthController {
  constructor(@inject(AuthService) private authService: AuthService,
    @inject(FirestoreService) private firestore: FirestoreService,
     @inject(FirmService) private firmService: FirmService) { }

  public login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { idToken } = req.body;
      if (!idToken) {
        throw new UnauthorizedError('ID token is missing.');
      }

      const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;
      const token = idToken; // The provided ID token already contains the correct claims
      if (!decodedToken['firmId'] || typeof decodedToken['firmId'] !== 'string') {
        throw new UnauthorizedError('User claims are incomplete. Please contact support.');
      }

      // Construct userClaims directly from the decoded token
      const userClaims: IUserIndex = {
        id: uid,
        firmId: decodedToken['firmId'],
        fullname: decodedToken['fullname'] || decodedToken['name'] || '', // Prefer fullname, fallback to name if needed
        email: decodedToken.email || '',
        isSuperAdmin: decodedToken['isSuperAdmin'] || false,
        department: decodedToken['department'] || '',
        admin: decodedToken['admin'] || false,
        roles: decodedToken['roles'] || {
          canBill: false,
          canSchedule: false,
          canAssign: false,
          fileManager: false,
          librarian: false
        },
      };

      
      // After successful authentication/migration, fetch the full user profile for the response.
      // The frontend needs the full IFirmUser object on login.
      const usersCollectionRef = this.firestore.db.collection('firms').doc(userClaims.firmId).collection('users');
      const firmUserDoc = await usersCollectionRef.doc(uid).get();

      if (!firmUserDoc.exists) {
        // This would be an inconsistent state, but we should handle it.
        throw new NotFoundError(`User profile for UID ${uid} not found in the firm database.`);
      }

      const fullUser = firmUserDoc.data() as IFirmUser;

      const response: IAuthResponse = {
        success: true,
        message: 'Login successful.',
        token: token,
        user: fullUser
      };
      res.status(HttpStatusCodes.OK).json(response);

    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles the public-facing request to accept an invitation and create a new user account.
   */
  public acceptInvitation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: AcceptInvitationDto = req.body;
      if (!dto.firmId) {
        throw new BadRequestError('Invalid request body.');
      };
      
      const authResponse = await this.authService.registerInvitedUser(dto.firmId, dto);
      res.status(201).json(authResponse);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles the authenticated user updating their own profile information.
   */
  public updateMyProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return next(new UnauthorizedError('Authentication required.'));

      const { id, firmId } = req.user; // Get user's own ID and firmId from token
      const updateData: Partial<IFirmUser> = req.body;

      const updatedUser = await this.authService.updateMyProfile(id, firmId, updateData);

      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  };


  requestPasswordReset = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      if (!email) {
        throw new BadRequestError('Email is required for password reset.');
      }
      await this.authService.requestPasswordReset(email);

      // Always send a generic success message to prevent attackers
      // from discovering which emails are registered.
      res.status(HttpStatusCodes.OK).json({
        message: 'If an account with that email exists, a password reset link has been sent.',
      }); 
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  resetPasswordWithCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, code, newPassword } = req.body;

      await this.authService.resetPasswordWithCode(email, code, newPassword);

      res.status(HttpStatusCodes.OK).json({
        message: 'Your password has been reset successfully.',
      });
    } catch (error) {
      next(error);
    }
  }



      /**
     * Handles the request to initiate the firm registration.
     */
    registerFirm = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const profile = req.body as IRegisterFirm & { subscriptionType: 'trial' | 'paid' };
            const result = await this.firmService.registerFirm(profile);
            return res.status(200).json(result);
        } catch (error) {
            return next(error);
        }
    };

    /**
     * Creates a user in a disabled state and sends a verification email.
     */
    initiateRegistration = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = req.body as IRegisterFirm;
            await this.firmService.initiateFirmRegistration(dto);
            res.status(200).json({ message: 'Verification email sent.' });
        } catch (error) {
            return next(error);
        }
    };

    resendVerificationEmail = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email } = req.body;
            await this.firmService.resendVerification(email);
            res.status(200).json({ message: 'Verification email sent.' });
        } catch (error) {
            return next(error);
        }
    };

}