import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { AuthService } from '../services/auth.service';
import firebaseAdmin from 'firebase-admin';
import { FirestoreService } from '../services/firestore.service';
import { AcceptInvitationDto, IAuthResponse, IUserIndex } from '@teddy-city-hotels/shared-interfaces';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../errors/http-errors';
import HttpStatusCodes from '../constants/HttpStatusCodes';
import { FirmService } from '../services/firm.service';

@injectable()
export class AuthController {
  constructor(@inject(AuthService) private authService: AuthService,
    @inject(FirestoreService) private firestore: FirestoreService,
     @inject(FirmService) private firmService: FirmService) { }

  public adminLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.adminLogin(email, password);

      console.log('result', result);
      res.status(HttpStatusCodes.OK).json(result);
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
        message: 'If an account with that email exists, a password reset code has been sent.',
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
