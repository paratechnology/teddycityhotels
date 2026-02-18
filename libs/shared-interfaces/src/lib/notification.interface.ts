export enum NotificationType {
  FILE_TRANSFER_REQUEST = 'file_transfer_request',
  TASK_ASSIGNED = 'task_assigned',
  MENTION = 'mention',
  FILE_TRANSFER_REJECTED = 'FILE_TRANSFER_REJECTED',
  FILE_TRANSFER_CANCELLED = 'file_transfer_cancelled',
}

export interface INotification {
  id: string;
  userId: string; // The user who receives the notification
  firmId: string; // For data scoping and security rules
  type: NotificationType;
  message: string; // The main text displayed in the notification list
  link: string; // A link to navigate to when the notification is clicked (e.g., '/tasks/task-id')
  read: boolean;
  createdAt: string; // ISO 8601 string
  relatedId?: string; // e.g., the ID of the task or file log entry
}



export interface IPushNotification {
  userId: string; // The user who should receive the notification
  title: string;
  body: string;
  link: string;
  isRead: string;
  createdAt: string;
  firmId: string
}
