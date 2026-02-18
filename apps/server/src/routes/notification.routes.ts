import { Router } from 'express';
import { container } from 'tsyringe';
import { NotificationController } from '../controllers/notification.controller';
import { verifyUser } from '../middleware/authenticate.middleware';

export class NotificationRoutes {
    public router: Router;
    private controller: NotificationController;

    constructor() {
        this.router = Router();
        this.controller = container.resolve(NotificationController);
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.use(verifyUser);
        this.router.post('/register-token', this.controller.registerToken);
        this.router.post('/:notificationId/read', this.controller.markAsRead);
    }
}