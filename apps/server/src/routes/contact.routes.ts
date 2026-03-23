import { Router } from 'express';
import { container } from 'tsyringe';
import { ContactController } from '../controllers/contact.controller';

export class ContactRoutes {
  public router: Router;
  private controller: ContactController;

  constructor() {
    this.router = Router();
    this.controller = container.resolve(ContactController);
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post('/', this.controller.createInquiry);
  }
}
