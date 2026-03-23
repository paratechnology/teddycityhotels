export enum NotificationType {
  FILE_TRANSFER_REQUEST = 'file_transfer_request',
  TASK_ASSIGNED = 'task_assigned',
  MENTION = 'mention',
  FILE_TRANSFER_REJECTED = 'FILE_TRANSFER_REJECTED',
  FILE_TRANSFER_CANCELLED = 'file_transfer_cancelled',
  BOOKING_CREATED = 'booking_created',
  BOOKING_STATUS_CHANGED = 'booking_status_changed',
  KITCHEN_ORDER_CREATED = 'kitchen_order_created',
  KITCHEN_ORDER_STATUS_CHANGED = 'kitchen_order_status_changed',
  KITCHEN_PAYMENT_STATUS_CHANGED = 'kitchen_payment_status_changed',
  CONTACT_INQUIRY_CREATED = 'contact_inquiry_created',
  SWIMMING_BOOKING_CREATED = 'swimming_booking_created',
  SWIMMING_BOOKING_STATUS_CHANGED = 'swimming_booking_status_changed',
  SWIMMING_PAYMENT_STATUS_CHANGED = 'swimming_payment_status_changed',
}

export interface INotification {
  id: string;
  userId: string;
  firmId: string;
  type: NotificationType;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
  relatedId?: string;
}

export interface IPushNotification {
  userId: string;
  title: string;
  body: string;
  link: string;
  isRead: string;
  createdAt: string;
  firmId: string;
}

export interface IAdminNotification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  link: string;
  read: boolean;
  createdAt: string;
  bookingId?: string;
  relatedId?: string;
}
