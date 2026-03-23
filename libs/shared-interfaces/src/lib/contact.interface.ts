export type ContactInquiryCategory =
  | 'general'
  | 'booking'
  | 'restaurant'
  | 'snooker'
  | 'swimming'
  | 'events';

export type ContactInquiryStatus = 'new' | 'in_progress' | 'resolved' | 'archived';

export interface IContactInquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  category: ContactInquiryCategory;
  message: string;
  status: ContactInquiryStatus;
  source: 'website' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface ICreateContactInquiryDto {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  category: ContactInquiryCategory;
  message: string;
}
