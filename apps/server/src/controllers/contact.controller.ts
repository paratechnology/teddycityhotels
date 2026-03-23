import { Request, Response, NextFunction } from 'express';
import { inject, injectable } from 'tsyringe';
import { ICreateContactInquiryDto } from '@teddy-city-hotels/shared-interfaces';
import { ContactService } from '../services/contact.service';

@injectable()
export class ContactController {
  constructor(@inject(ContactService) private contactService: ContactService) {}

  createInquiry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const row = await this.contactService.createInquiry(req.body as ICreateContactInquiryDto);
      res.status(201).json(row);
    } catch (error) {
      next(error);
    }
  };
}
