import { Router } from 'express';
import { container } from 'tsyringe';
import { AppController } from '../controllers/app.controller';

export class AppRoutes {
  public router: Router;
  private appController = container.resolve(AppController);

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Route for the in-app update service (@capawesome/capacitor-app-update)
    this.router.get('/version-info', this.appController.getVersionInfo);

    // Route for the marketing site's download page
    this.router.get('/download-links', this.appController.getDownloadLinks);
  }
}