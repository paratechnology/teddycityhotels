import { Router } from 'express';
import { AttachmentController } from '../controllers/attachment.controller';
import { validationMiddleware } from '../middleware/validation.middleware';
import { container } from 'tsyringe';
import { GenerateUploadUrlSchema } from '@quickprolaw/shared-interfaces';

export class AttachmentRoutes {
  public router: Router;
  private controller: AttachmentController;

  constructor() {
    this.router = Router();
    this.controller = container.resolve(AttachmentController);
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post('/tasks/:taskId/attachments/generate-upload-url', validationMiddleware(GenerateUploadUrlSchema), this.controller.generateUploadUrl);
  }
}