import { Booking } from './booking.interface';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  userId: string;
  booking: Booking;
  items: InvoiceItem[];
  totalAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  createdAt: string;
  dueDate: string;
}
