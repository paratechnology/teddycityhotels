import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { PushNotificationService } from '../services/push-notification.service';
import { NotificationService } from '../services/notification.service';

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

  listAdminNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pageQuery = req.query['page'];
      const pageSizeQuery = req.query['pageSize'];
      const search = req.query['search'] as string | undefined;
      const read = req.query['read'] as string | undefined;

      if (pageQuery !== undefined || pageSizeQuery !== undefined || search !== undefined || read !== undefined) {
        const page = Number(pageQuery || 1);
        const pageSize = Number(pageSizeQuery || 12);
        const notifications = await this.notificationService.getAdminNotificationsPaginated({
          page,
          pageSize,
          search,
          read: read === 'read' || read === 'unread' ? read : undefined,
        });
        res.status(200).json(notifications);
        return;
      }

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
