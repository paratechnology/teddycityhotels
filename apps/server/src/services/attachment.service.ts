import { inject, injectable } from 'tsyringe';
import { FirestoreService } from './firestore.service';

@injectable()
export class AttachmentService {
  constructor(@inject(FirestoreService) private firestore: FirestoreService) {}

  async generateUploadUrl(
    firmId: string,
    taskId: string,
    fileName: string,
    contentType: string
  ): Promise<{ uploadUrl: string; filePath: string }> {
    const filePath = `${firmId}/tasks/${taskId}/${Date.now()}-${fileName}`;
    const file = this.firestore.storage.bucket().file(filePath);

    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000,
      contentType,
    });

    return { uploadUrl, filePath };
  }

  async generateAdminUploadUrl(
    fileName: string,
    contentType: string
  ): Promise<{ uploadUrl: string; filePath: string }> {
    const filePath = `hotel-admin/uploads/${Date.now()}-${fileName}`;
    const file = this.firestore.storage.bucket().file(filePath);

    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000,
      contentType,
    });

    return { uploadUrl, filePath };
  }
}
