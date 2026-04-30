import { Router } from 'express';
import { container } from 'tsyringe';
import { PropertyController } from '../controllers/property.controller';
import { verifyUser } from '../middleware/authenticate.middleware';
import { adminOnly, requireModuleAccess } from '../middleware/admin.middleware';

export class PropertyRoutes {
  public router: Router;
  private controller: PropertyController;

  constructor() {
    this.router = Router();
    this.controller = container.resolve(PropertyController);
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Public
    this.router.get('/', this.controller.list);
    this.router.get('/slug/:slug', this.controller.getBySlug);
    this.router.get('/:id', this.controller.getById);

    // Admin
    this.router.get(
      '/admin/list',
      verifyUser,
      adminOnly,
      requireModuleAccess('properties'),
      this.controller.listAdmin
    );
    this.router.post(
      '/',
      verifyUser,
      adminOnly,
      requireModuleAccess('properties'),
      this.controller.create
    );
    this.router.put(
      '/:id',
      verifyUser,
      adminOnly,
      requireModuleAccess('properties'),
      this.controller.update
    );
    this.router.delete(
      '/:id',
      verifyUser,
      adminOnly,
      requireModuleAccess('properties'),
      this.controller.delete
    );
  }
}
