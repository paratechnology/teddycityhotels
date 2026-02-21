import { inject, injectable } from 'tsyringe';
import { FirestoreService } from './firestore.service';
import { INotification } from '@teddy-city-hotels/shared-interfaces';
import { PushNotificationService } from './push-notification.service';

@injectable()
export class NotificationService {
  constructor(
    @inject(FirestoreService) private firestore: FirestoreService,
    @inject(PushNotificationService) private pushService: PushNotificationService
  ) {}

  /**
   * Creates an in-app notification document and triggers a push notification.
   */
  async create(firmId: string, userId: string, data: Omit<INotification, 'id' | 'createdAt' | 'read'>): Promise<void> {
    const notificationRef = this.firestore.db.collection(`firms/${firmId}/users/${userId}/notifications`).doc();
    const newNotification: INotification = {
      ...data,
      firmId, // Ensure firmId is on the document
      userId, // Ensure userId is on the document
      id: notificationRef.id,
      createdAt: new Date().toISOString(),
      read: false,
    };
    await notificationRef.set(newNotification);

    // Now, trigger the push notification
    await this.pushService.sendToUser(userId, firmId, {
      title: 'New Notification', // Generic title, can be improved
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
    return snapshot.docs.map(doc => doc.data() as INotification);
  }

  async markAsRead(firmId: string, userId: string, notificationId: string): Promise<void> {
    const notificationRef = this.firestore.db.doc(`firms/${firmId}/users/${userId}/notifications/${notificationId}`);
    // Using update is sufficient here. No need to check for existence first,
    // as an error will be thrown if the document doesn't exist, which is the desired behavior.
    await notificationRef.update({ read: true });
  }
}