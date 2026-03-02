import { injectable, inject } from 'tsyringe';
import { FirestoreService } from './firestore.service';
import { IFirmUser, IPushNotification } from '@teddy-city-hotels/shared-interfaces';
import * as admin from 'firebase-admin';

@injectable()
export class PushNotificationService {
  constructor(@inject(FirestoreService) private firestore: FirestoreService) {}

  async registerToken(user: IFirmUser, token: string, firmId: string): Promise<void> {
    if (!user || !token) {
      return;
    }

    const userRef = this.firestore.db.collection(`firms/${user.firmId}/users`).doc(user.id);
    await userRef.update({
      fcmTokens: admin.firestore.FieldValue.arrayUnion(token),
    });

    try {
      await admin.messaging().subscribeToTopic(token, firmId);
    } catch (_error) {
      // no-op
    }
  }

  async registerTokenToTopic(token: string, topic: string): Promise<void> {
    if (!token) {
      return;
    }

    await admin.messaging().subscribeToTopic(token, topic);
  }

  async sendToUser(
    userId: string,
    firmId: string,
    notification: Omit<IPushNotification, 'id' | 'userId' | 'firmId' | 'isRead' | 'createdAt'>
  ): Promise<void> {
    try {
      const userDoc = await this.firestore.db.collection(`firms/${firmId}/users`).doc(userId).get();
      if (!userDoc.exists) {
        return;
      }

      const user = userDoc.data() as IFirmUser;
      const tokens = user.fcmTokens;

      if (!tokens || tokens.length === 0) {
        return;
      }

      const message: admin.messaging.MulticastMessage = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: {
          link: notification.link,
        },
        tokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      await this.cleanupInvalidTokens(response, userId, firmId, tokens);
    } catch (_error) {
      // no-op
    }
  }

  private async cleanupInvalidTokens(response: admin.messaging.BatchResponse, userId: string, firmId: string, tokens: string[]) {
    const tokensToRemove: string[] = [];
    response.responses.forEach((result, index) => {
      const error = result.error;
      if (error) {
        if (
          error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered'
        ) {
          tokensToRemove.push(tokens[index]);
        }
      }
    });

    if (tokensToRemove.length > 0) {
      const userRef = this.firestore.db.collection(`firms/${firmId}/users`).doc(userId);
      await userRef.update({
        fcmTokens: admin.firestore.FieldValue.arrayRemove(...tokensToRemove),
      });
    }
  }

  async sendToTopic(topic: string, title: string, body: string, data?: { route?: string; link?: string }): Promise<void> {
    const message: admin.messaging.Message = {
      notification: {
        title,
        body,
      },
      topic,
      data: {
        link: data?.route || data?.link || '/',
      },
    };

    await admin.messaging().send(message);
  }
}
