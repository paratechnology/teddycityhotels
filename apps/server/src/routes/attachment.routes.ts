import { Router } from 'express';
import { AttachmentController } from '../controllers/attachment.controller';
import { validationMiddleware } from '../middleware/validation.middleware';
import { container } from 'tsyringe';
import { GenerateUploadUrlSchema } from '@teddy-city-hotels/shared-interfaces';
import { verifyUser } from '../middleware/authenticate.middleware';

export class AttachmentRoutes {
  public router: Router;
  private controller: AttachmentController;

  constructor() {
    this.router = Router();
    this.controller = container.resolve(AttachmentController);
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use(verifyUser);
    this.router.post(
      '/upload-url',
      validationMiddleware(GenerateUploadUrlSchema),
      this.controller.generateAdminUploadUrl
    );
    this.router.post(
      '/tasks/:taskId/attachments/generate-upload-url',
      validationMiddleware(GenerateUploadUrlSchema),
      this.controller.generateUploadUrl
    );
  }
}
