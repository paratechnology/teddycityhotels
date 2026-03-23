import { inject, injectable } from 'tsyringe';
import {
  IContactInquiry,
  ICreateContactInquiryDto,
  NotificationType,
} from '@teddy-city-hotels/shared-interfaces';
import { FirestoreService } from './firestore.service';
import { NotificationService } from './notification.service';
import { BadRequestError } from '../errors/http-errors';

@injectable()
export class ContactService {
  constructor(
    @inject(FirestoreService) private firestore: FirestoreService,
    @inject(NotificationService) private notificationService: NotificationService
  ) {}

  private getCollection() {
    return this.firestore.db.collection('contactInquiries');
  }

  async createInquiry(payload: ICreateContactInquiryDto): Promise<IContactInquiry> {
    const name = String(payload.name || '').trim();
    const email = String(payload.email || '').trim().toLowerCase();
    const subject = String(payload.subject || '').trim();
    const message = String(payload.message || '').trim();
    const phone = String(payload.phone || '').trim() || undefined;
    const category = payload.category || 'general';

    if (!name) throw new BadRequestError('Name is required.');
    if (!email) throw new BadRequestError('Email is required.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestError('A valid email address is required.');
    }
    if (!subject) throw new BadRequestError('Subject is required.');
    if (!message) throw new BadRequestError('Message is required.');

    const now = new Date().toISOString();
    const ref = this.getCollection().doc();
    const inquiry: IContactInquiry = {
      id: ref.id,
      name,
      email,
      phone,
      subject,
      category,
      message,
      status: 'new',
      source: 'website',
      createdAt: now,
      updatedAt: now,
    };

    await ref.set(inquiry);

    await this.notificationService.createAdminNotification({
      title: 'New Contact Inquiry',
      body: `${inquiry.name} sent a ${inquiry.category.replace(/_/g, ' ')} inquiry.`,
      type: NotificationType.CONTACT_INQUIRY_CREATED,
      link: '/notifications',
      relatedId: inquiry.id,
    });

    return inquiry;
  }
}
