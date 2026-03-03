import { z } from 'zod';
import { IFirmUserSubset } from './user.interface';

export interface IAttachment {
  id: string;
  fileName: string;
  filePath: string;
  downloadURL: string;
  contentType: string;
  size: number;
  uploadedBy: IFirmUserSubset;
  uploadedAt: string;
}

export interface CreateAttachmentDto {
  fileName: string;
  filePath: string;
  downloadURL: string;
  contentType: string;
  size: number;
}

export const GenerateUploadUrlSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
});

export type GenerateUploadUrlDto = z.infer<typeof GenerateUploadUrlSchema>;

export interface IUploadUrlResponse {
  uploadUrl: string;
  filePath: string;
}

export const PublishUploadSchema = z.object({
  filePath: z.string().min(1),
});

export type PublishUploadDto = z.infer<typeof PublishUploadSchema>;

export interface IPublishUploadResponse {
  filePath: string;
  publicUrl: string;
}
