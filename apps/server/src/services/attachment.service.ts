import { inject, injectable } from 'tsyringe';
import { FirestoreService } from './firestore.service';

@injectable()
export class AttachmentService {
  constructor(@inject(FirestoreService) private firestore: FirestoreService) {}

  private formatPublicUrl(filePath: string): string {
    const encodedPath = filePath
      .split('/')
      .map((part) => encodeURIComponent(part))
      .join('/');
    return `https://storage.googleapis.com/${this.firestore.storage.bucket().name}/${encodedPath}`;
  }

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

  async publishAdminUpload(filePath: string): Promise<{ filePath: string; publicUrl: string }> {
    const file = this.firestore.storage.bucket().file(filePath);
    await file.makePublic();

    return {
      filePath,
      publicUrl: this.formatPublicUrl(filePath),
    };
  }
}
