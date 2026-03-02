import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { PushNotificationService } from '../services/push-notification.service';
import { NotificationService } from '../services/notification.service';
import { UnauthorizedError } from '../errors/http-errors';

@injectable()
export class NotificationController {
  constructor(
    @inject(PushNotificationService) private pushService: PushNotificationService,
    @inject(NotificationService) private notificationService: NotificationService
  ) {}

  registerToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;
      await this.pushService.registerTokenToTopic(token, 'hotel-admins');
      res.status(200).json({ message: 'Token registered successfully.' });
    } catch (error) {
      next(error);
    }
  };

  listAdminNotifications = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const notifications = await this.notificationService.getAdminNotifications();
      res.status(200).json(notifications);
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { notificationId } = req.params;
      await this.notificationService.markAdminNotificationAsRead(notificationId);
      res.status(200).json({ message: 'Notification marked as read.' });
    } catch (error) {
      next(error);
    }
  };
}
