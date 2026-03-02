import { Router } from 'express';
import { container } from 'tsyringe';
import { AdminUsersController } from '../controllers/admin-users.controller';
import { verifyUser } from '../middleware/authenticate.middleware';
import { adminOnly, requireModuleAccess } from '../middleware/admin.middleware';
import { ForbiddenError } from '../errors/http-errors';

export class AdminUsersRoutes {
  public router: Router;
  private controller: AdminUsersController;

  constructor() {
    this.router = Router();
    this.controller = container.resolve(AdminUsersController);
    this.initializeRoutes();
  }

  private requireSuperAdmin = (req: any, _res: any, next: any) => {
    if (req.user?.isSuperAdmin) {
      return next();
    }
    return next(new ForbiddenError('Only super admins can manage admin users.'));
  };

  private initializeRoutes() {
    this.router.use(verifyUser, adminOnly);

    this.router.get('/me', this.controller.me);
    this.router.get('/', requireModuleAccess('admins'), this.controller.list);
    this.router.post('/', this.requireSuperAdmin, this.controller.create);
    this.router.patch('/:adminId', this.requireSuperAdmin, this.controller.update);
  }
}
