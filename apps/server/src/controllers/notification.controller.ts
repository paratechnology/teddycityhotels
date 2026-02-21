import { Request,  Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';

import { IFirmUser, IUserIndex } from '@teddy-city-hotels/shared-interfaces';
import { PushNotificationService } from '../services/push-notification.service';
import { NotificationService } from '../services/notification.service';

@injectable()
export class NotificationController {
    constructor(
        @inject(PushNotificationService) private pushService: PushNotificationService,
        @inject(NotificationService) private notificationService: NotificationService
    ) { }

    registerToken = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = req.user as IFirmUser;
            const { token } = req.body;

            await this.pushService.registerToken(user, token, user.firmId);
            res.status(200).json({ message: 'Token registered successfully.' });
        } catch (error) {
            next(error);
        }
    }

    markAsRead = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = req.user as IUserIndex;
            const { notificationId } = req.params;

            await this.notificationService.markAsRead(user.firmId, user.id, notificationId);
            res.status(200).json({ message: 'Notification marked as read.' });
        } catch (error) {
            next(error);
        }
    }
}