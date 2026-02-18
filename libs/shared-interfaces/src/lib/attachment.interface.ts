import { IFirmUserSubset } from "./user.interface";

export interface IAttachment {
  id: string;
  fileName: string;
  filePath: string; // The full path in Cloud Storage
  downloadURL: string; // The public or signed URL to view/download the file
  contentType: string; // e.g., 'application/pdf'
  size: number; // in bytes
  uploadedBy: IFirmUserSubset;
  uploadedAt: string; // ISO 8601 string
}

