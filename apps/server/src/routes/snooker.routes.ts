import { Router } from 'express';
import { container } from 'tsyringe';
import { SnookerController } from '../controllers/snooker.controller';

export class SnookerRoutes {
  public router: Router;
  private snookerController: SnookerController;

  constructor() {
    this.router = Router();
    this.snookerController = container.resolve(SnookerController);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', this.snookerController.getLeagueInfo);
    this.router.post('/register', this.snookerController.registerPlayer);
  }
}
