import { Router } from 'express';
import { AdminDashboardController } from '../controllers/admin-dashboard.controller';
import { container } from 'tsyringe';
import { verifyUser } from '../middleware/authenticate.middleware';
import { adminOnly, requireModuleAccess } from '../middleware/admin.middleware';

export class AdminDashboardRoutes {
  public router: Router;
  private controller: AdminDashboardController;

  constructor() {
    this.router = Router();
    this.controller = container.resolve(AdminDashboardController);
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use(verifyUser, adminOnly, requireModuleAccess('dashboard'));
    this.router.get('/', this.controller.getDashboardStats);
  }
}
