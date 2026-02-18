import { Request, Response, NextFunction, response } from 'express';
import { injectable, inject } from 'tsyringe';
import { IFirmUser } from '@quickprolaw/shared-interfaces';
import { UserService } from '../services/user.service';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../errors/http-errors';
import { FirestoreService } from '../services/firestore.service';


@injectable()
export class UserController {
  constructor(@inject(UserService) private userService: UserService,
    @inject(FirestoreService) private firestoreService: FirestoreService) { }

  public getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError('Authentication required.'));
      }
      const { firmId, id } = req.user;
      const userProfile = await this.userService.findById(firmId, id);
      res.status(200).json(userProfile);
    } catch (error) {
      next(error);
    }
  };

  public markTourAsSeen = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError('Authentication required.'));
      }

      const { firmId, id: userId } = req.user;
      const { tourId } = req.body ?? {};

      if (!tourId || typeof tourId !== 'string' || tourId.trim().length === 0) {
        throw new BadRequestError('tourId is required.');
      }

      await this.userService.markTourAsSeen(firmId, userId, tourId.trim());
      const updatedUserProfile = await this.userService.findById(firmId, userId);

      res.status(200).json(updatedUserProfile);
    } catch (error) {
      next(error);
    }
  };

  findAllByFirm = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as IFirmUser;
      // Authorization is handled by the `adminOnly` middleware applied in the route.
      const users = await this.userService.findAllByFirm(user.firmId);
      res.status(200).json(users);
    } catch (error) {
      // Forward the error to a centralized error handler
      next(error);
    }
  };

  getSaxumlegalUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Hardcoded firmId for this specific public endpoint
      const users = await this.userService.findAllByFirm('saxumlegal');
      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  }

  async updateRole(req:Request, res: Response): Promise<IFirmUser> {
   const adminFirmId = req.user?.firmId;
   const newRole = req.body.role;
   const userIdToUpdate = req.params['userId'];

   if (!adminFirmId) throw Error('FirmId is missing');
   
    const userRef = this.firestoreService.db.collection('firms').doc(adminFirmId).collection('users').doc(userIdToUpdate);
    const doc = await userRef.get();

    if (!doc.exists) {
      throw new NotFoundError('User not found.');
    }

    const user = doc.data() as IFirmUser;
    if (user.firmId !== adminFirmId) {
      throw new NotFoundError('User not found.'); // Obscure the error for security
    }

    await userRef.update({ role: newRole });
    return { ...user, designation: newRole };
  }

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { firmId } = req.user!;
      const { userId } = req.params;
      const { active } = req.body; // Expect boolean
      
      await this.userService.updateUserStatus(firmId, userId, active);
      res.status(200).json({ message: `User ${active ? 'activated' : 'deactivated'} successfully.` });
    } catch (error) {
      next(error);
    }
  };

getMyPossessions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { firmId, id: userId } = req.user!;
      const inventory = await this.userService.findMyPossessions(firmId, userId);
      res.status(200).json(inventory);
    } catch (error) {
      next(error);
    }
  };


      /**
     * Generates a signed URL for uploading a profile picture.
     */
    getProfilePictureUrl = async (req: any, res: Response, next: NextFunction) => {
        try {
            const { firmId, id: userId } = req.user; // From verifyUser middleware
            const { contentType } = req.body;
            if (!contentType) {
                throw new BadRequestError('Content type is required.');
            }
            const urls = await this.userService.generateProfilePictureUploadUrl(firmId, userId, contentType);
            res.status(200).json(urls);
        } catch (error) {
            next(error);
        }
    };

    public connectPersonalMicrosoftAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new UnauthorizedError('Authentication required.');
            const { firmId, id } = req.user;
            const { code, redirectUri } = req.body;
            if (!code || !redirectUri) {
                throw new BadRequestError('Authorization code and redirect URI are required.');
            }
            await this.userService.connectPersonalMicrosoftAccount(firmId, id, code, redirectUri);
            res.status(200).json({ message: 'Microsoft account connected successfully for signatures.' });
        } catch (error) {
            next(error);
        }
    };

    public generateSignatureUploadUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new UnauthorizedError('Authentication required.');
            const { firmId, id } = req.user;
            const result = await this.userService.generateSignatureUploadUrl(firmId, id);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    public finalizeSignatureUpload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new UnauthorizedError('Authentication required.');
            const { firmId, id } = req.user;
            const { itemId } = req.body;
            if (!itemId) {
                throw new BadRequestError('Item ID is required to finalize signature upload.');
            }
            await this.userService.finalizeSignatureUpload(firmId, id, itemId);
            res.status(200).json({ message: 'Signature secured.' });
        } catch (error) {
            next(error);
        }
    };

    public getSignatureImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new UnauthorizedError('Authentication required.');
            const { firmId, id } = req.user;

            const { stream, contentType } = await this.userService.getSignatureStream(firmId, id);

            res.setHeader('Content-Type', contentType);
            // Disable caching for signature images to ensure updates are reflected immediately
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            
            stream.pipe(res);
        } catch (error) {
            next(error);
        }
    };

    public removeSignature = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new UnauthorizedError('Authentication required.');
            const { firmId, id } = req.user;
            await this.userService.removeSignature(firmId, id);
            res.status(200).json({ message: 'Signature removed successfully.' });
        } catch (error) {
            next(error);
        }
    };

    public removePersonalMicrosoftAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new UnauthorizedError('Authentication required.');
            const { firmId, id } = req.user;
            await this.userService.removePersonalMicrosoftAccount(firmId, id);
            res.status(200).json({ message: 'Personal Microsoft account integration removed successfully.' });
        } catch (error) {
            next(error);
        }
    };

}
