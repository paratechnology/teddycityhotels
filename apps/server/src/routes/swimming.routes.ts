import { Router } from 'express';
import { container } from 'tsyringe';
import { SwimmingController } from '../controllers/swimming.controller';

export class SwimmingRoutes {
  public router: Router;
  private swimmingController: SwimmingController;

  constructor() {
    this.router = Router();
    this.swimmingController = container.resolve(SwimmingController);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', this.swimmingController.getOfferings);
    this.router.post('/book', this.swimmingController.bookLesson);
  }
}
