import express, { Router } from 'express';
import { container } from 'tsyringe';
import { AuthController } from '../controllers/auth.controller';

import { validationMiddleware } from '../middleware/validation.middleware';
import { AcceptInvitationSchema } from '@teddy-city-hotels/shared-interfaces';


export class AuthRoutes {
    public router: Router;
    private controller: AuthController


    constructor() {
        this.router = express.Router();
        this.controller = container.resolve(AuthController);
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post('/admin-login', this.controller.adminLogin);
        this.router.post('/resend-verification', this.controller.resendVerificationEmail);
        this.router.post('/accept-invitation', validationMiddleware(AcceptInvitationSchema), this.controller.acceptInvitation);
        this.router.post('/request-password-reset', this.controller.requestPasswordReset);
        this.router.post('/reset-password', this.controller.resetPasswordWithCode);
    }
}   
