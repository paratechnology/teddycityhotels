import { Request, NextFunction, Response } from 'express';
import { AttachmentService } from '../services/attachment.service';
import { GenerateUploadUrlDto, PublishUploadDto } from '@teddy-city-hotels/shared-interfaces';
import { injectable, inject } from 'tsyringe';
import { UnauthorizedError } from '../errors/http-errors';

@injectable()
export class AttachmentController {
  constructor(@inject(AttachmentService) private attachmentService: AttachmentService) {}

  generateUploadUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return next(new UnauthorizedError('Authentication required.'));
      const { taskId } = req.params;
      const { fileName, contentType }: GenerateUploadUrlDto = req.body;

      const result = await this.attachmentService.generateUploadUrl(
        req.user.firmId,
        taskId,
        fileName,
        contentType
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  generateAdminUploadUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return next(new UnauthorizedError('Authentication required.'));
      const { fileName, contentType }: GenerateUploadUrlDto = req.body;
      const result = await this.attachmentService.generateAdminUploadUrl(fileName, contentType);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  publishAdminUpload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return next(new UnauthorizedError('Authentication required.'));
      const { filePath }: PublishUploadDto = req.body;
      const result = await this.attachmentService.publishAdminUpload(filePath);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
