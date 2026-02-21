import express, { Router } from 'express';
import { container } from 'tsyringe';
import { AuthController } from '../controllers/auth.controller';
import { FirmController } from '../controllers/firm.controller';

import { validationMiddleware } from '../middleware/validation.middleware';
import { InvitationRoutes } from './invitation.routes';
import { verifyUser } from '../middleware/authenticate.middleware';
import { AcceptInvitationSchema } from '@teddy-city-hotels/shared-interfaces';


export class AuthRoutes {
    public router: Router;
    private controller: AuthController
    private firmController: FirmController;


    constructor() {
        this.router = express.Router();
        this.controller = container.resolve(AuthController);
        this.firmController = container.resolve(FirmController);
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post('/login', this.controller.login);
        this.router.post('/initiate-registration', this.controller.initiateRegistration);
        this.router.post('/resend-verification', this.controller.resendVerificationEmail);
        this.router.post('/accept-invitation', validationMiddleware(AcceptInvitationSchema), this.controller.acceptInvitation);
        this.router.post('/request-password-reset', this.controller.requestPasswordReset);
        this.router.post('/reset-password', this.controller.resetPasswordWithCode);
        this.router.put('/my-profile', verifyUser, this.controller.updateMyProfile);
        // this.router.post('/logout', verifyUser, this.controller.logout);
        this.router.use('/invitations', new InvitationRoutes().router);
        
        // Public Account Deletion Routes (Play Store Compliance)
        this.router.post('/request-deletion', this.firmController.requestFirmDeletion);
        this.router.post('/confirm-deletion', this.firmController.completeFirmDeletion);

    }
}   
