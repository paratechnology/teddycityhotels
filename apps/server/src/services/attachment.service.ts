import { inject, injectable } from 'tsyringe';
import { StorageService } from './storage.service';

@injectable()
export class AttachmentService {
  constructor(
    @inject(StorageService) private storageService: StorageService
  ) {}

  async generateUploadUrl(firmId: string, taskId: string, fileName: string, contentType: string): Promise<{ uploadUrl: string; filePath: string }> {
    const filePath = `${firmId}/tasks/${taskId}/${Date.now()}-${fileName}`;
    const file = this.storageService.bucket.file(filePath);

    const options = {
      version: 'v4' as const,
      action: 'write' as const,
      expires: Date.now() + 15 * 60 * 1000, // 15-minute expiry
      contentType: contentType,
    };

    const [uploadUrl] = await file.getSignedUrl(options);

    return { uploadUrl, filePath };
  }
}