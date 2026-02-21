import { injectable, inject } from 'tsyringe';
import { FirestoreService } from './firestore.service';
import { IFirmUser, IPushNotification } from '@teddy-city-hotels/shared-interfaces';
import * as admin from 'firebase-admin';
import { link } from 'fs';

@injectable()
export class PushNotificationService {
    constructor(@inject(FirestoreService) private firestore: FirestoreService) { }

    async registerToken(user: IFirmUser, token: string, firmId: string): Promise<void> {
        if (!user || !token) {
            return;
        }

        const userRef = this.firestore.db.collection(`firms/${user.firmId}/users`).doc(user.id);
        // Use FieldValue.arrayUnion to add the token only if it's not already present.
        // This prevents duplicate tokens for the same device.
        await userRef.update({
            fcmTokens: admin.firestore.FieldValue.arrayUnion(token)
        });

        // Subscribe the new token to the firm's topic.
        try {
            await admin.messaging().subscribeToTopic(token, firmId);
            console.log(`Successfully subscribed token to topic: ${firmId}`);
        } catch (error) {
            console.error(`Error subscribing token to topic ${firmId}:`, error);
            // We don't throw here, as saving the token is the primary goal.
            // Logging the error is sufficient for debugging.
        }
    }

    async sendToUser(userId: string, firmId: string, notification: Omit<IPushNotification, 'id' | 'userId' | 'firmId' | 'isRead' | 'createdAt'>): Promise<void> {
        try {
            const userDoc = await this.firestore.db.collection(`firms/${firmId}/users`).doc(userId).get();
            if (!userDoc.exists) {
                console.warn(`User ${userId} not found in firm ${firmId} for push notification.`);
                return;
            }

            const user = userDoc.data() as IFirmUser;
            const tokens = user.fcmTokens;

            if (!tokens || tokens.length === 0) {
                // No devices registered for this user, so nothing to do.
                console.log('no device registered');
                return;
            }

            // Use MulticastMessage for sending to multiple tokens
            const message: admin.messaging.MulticastMessage = {
                notification: {
                    title: notification.title,
                    body: notification.body,
                },
                data: {
                    link: notification.link
                },
                tokens: tokens,
            };

            const response = await admin.messaging().sendEachForMulticast(message);
            // After sending, it's good practice to clean up tokens that are no longer valid.
            await this.cleanupInvalidTokens(response, userId, firmId, tokens);
        } catch (error) {
            console.error(`Error sending push notification to user ${userId}:`, error);
        }
    }

    private async cleanupInvalidTokens(response: admin.messaging.BatchResponse, userId: string, firmId: string, tokens: string[]) {
        const tokensToRemove: string[] = [];
        response.responses.forEach((result, index) => {
            const error = result.error;
            if (error) {
                console.error('Failure sending notification to', tokens[index], error);
                // Cleanup the tokens that are not registered anymore.
                if (error.code === 'messaging/invalid-registration-token' || error.code === 'messaging/registration-token-not-registered') {
                    tokensToRemove.push(tokens[index]);
                }
            }
        });

        if (tokensToRemove.length > 0) {
            const userRef = this.firestore.db.collection(`firms/${firmId}/users`).doc(userId);
            await userRef.update({
                fcmTokens: admin.firestore.FieldValue.arrayRemove(...tokensToRemove)
            });
        }
    }

    /**
     * Sends a notification to all devices subscribed to a specific topic.
     * @param topic The topic to send the notification to (e.g., a firmId).
     * @param title The title of the notification.
     * @param body The body of the notification.
     */
    async sendToTopic(topic: string, title: string, body: string, data: any): Promise<void> {

        console.log('topic', topic);
        const message: admin.messaging.Message = {
            notification: {
                title,
                body,
                
            },
            topic: topic,
            data:{
                link: data.route
            }
        };

        try {
            await admin.messaging().send(message);
            console.log(`Successfully sent notification to topic: ${topic}`);
        } catch (error) {
            console.error(`Error sending notification to topic ${topic}:`, error);
        }
    }
}