import { inject, injectable } from 'tsyringe';
import { FirestoreService } from './firestore.service';
import { IAdminNotification, INotification, NotificationType } from '@teddy-city-hotels/shared-interfaces';
import { PushNotificationService } from './push-notification.service';

@injectable()
export class NotificationService {
  constructor(
    @inject(FirestoreService) private firestore: FirestoreService,
    @inject(PushNotificationService) private pushService: PushNotificationService
  ) {}

  async create(firmId: string, userId: string, data: Omit<INotification, 'id' | 'createdAt' | 'read'>): Promise<void> {
    const notificationRef = this.firestore.db.collection(`firms/${firmId}/users/${userId}/notifications`).doc();
    const newNotification: INotification = {
      ...data,
      firmId,
      userId,
      id: notificationRef.id,
      createdAt: new Date().toISOString(),
      read: false,
    };
    await notificationRef.set(newNotification);

    await this.pushService.sendToUser(userId, firmId, {
      title: 'New Notification',
      body: newNotification.message,
      link: newNotification.link,
    });
  }

  async getForUser(firmId: string, userId: string): Promise<INotification[]> {
    const notificationsRef = this.firestore.db.collection(`firms/${firmId}/users/${userId}/notifications`);
    const snapshot = await notificationsRef.orderBy('createdAt', 'desc').limit(50).get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map((doc) => doc.data() as INotification);
  }

  async markAsRead(firmId: string, userId: string, notificationId: string): Promise<void> {
    const notificationRef = this.firestore.db.doc(`firms/${firmId}/users/${userId}/notifications/${notificationId}`);
    await notificationRef.update({ read: true });
  }

  private getAdminNotificationsCollection() {
    return this.firestore.db.collection('adminNotifications');
  }

  async createAdminNotification(input: {
    title: string;
    body: string;
    type: NotificationType;
    link: string;
    bookingId?: string;
  }): Promise<IAdminNotification> {
    const ref = this.getAdminNotificationsCollection().doc();
    const notification: IAdminNotification = {
      id: ref.id,
      title: input.title,
      body: input.body,
      type: input.type,
      link: input.link,
      bookingId: input.bookingId,
      read: false,
      createdAt: new Date().toISOString(),
    };

    await ref.set(notification);
    await this.pushService.sendToTopic('hotel-admins', notification.title, notification.body, { link: notification.link });

    return notification;
  }

  async getAdminNotifications(): Promise<IAdminNotification[]> {
    const snapshot = await this.getAdminNotificationsCollection().orderBy('createdAt', 'desc').limit(100).get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as IAdminNotification));
  }

  async markAdminNotificationAsRead(notificationId: string): Promise<void> {
    await this.getAdminNotificationsCollection().doc(notificationId).update({ read: true });
  }
}
