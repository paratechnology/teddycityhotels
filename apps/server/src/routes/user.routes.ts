import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { container } from 'tsyringe';
import { adminOnly } from '../middleware/admin.middleware';
import { verifyUser } from '../middleware/authenticate.middleware';
// import { UpdateUserRoleDto } from '../dtos/update-user-role.dto';


export class UserRoutes {
  public router: Router;
  private controller: UserController;

  constructor() {
    this.router = Router();
    this.controller = container.resolve(UserController);
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/me', this.controller.getMe); // New route to get current user profile
    this.router.get('/firm', this.controller.findAllByFirm);
    this.router.get('/me/posessions', this.controller.getMyPossessions);
    this.router.post('/me/seen-tours', this.controller.markTourAsSeen);
    this.router.post('/profile-picture-url', verifyUser as any, this.controller.getProfilePictureUrl);
    this.router.get('/me/signature', this.controller.getSignatureImage);

    // --- Individual MSAL Integration for Signatures ---
    this.router.post('/signature/connect', this.controller.connectPersonalMicrosoftAccount);
    this.router.post('/signature/upload', this.controller.generateSignatureUploadUrl);
    this.router.post('/signature/finalize', this.controller.finalizeSignatureUpload);
    this.router.delete('/signature/integration', this.controller.removePersonalMicrosoftAccount);
    this.router.delete('/signature', this.controller.removeSignature);

    this.router.patch('/:userId/status', adminOnly, this.controller.updateStatus);
    // this.router.patch('/:userId/role', adminOnly, validationMiddleware(UpdateUserRoleDto), this.controller.updateRole);
  }
}
