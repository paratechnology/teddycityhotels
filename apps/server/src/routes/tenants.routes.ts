import { Router } from 'express';
import { container } from 'tsyringe';
import { TenantsController } from '../controllers/tenants.controller';
import { verifyUser } from '../middleware/authenticate.middleware';

export class TenantRoutes {
  public router: Router;
  private controller: TenantsController;

  constructor() {
    this.router = Router();
    this.controller = container.resolve(TenantsController);
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use(verifyUser); // Secure all endpoints

    this.router.get('/', this.controller.getAll.bind(this.controller));
    this.router.get('/search', this.controller.search.bind(this.controller));
    this.router.post('/', this.controller.create.bind(this.controller));
    this.router.put('/:id', this.controller.update.bind(this.controller));
    this.router.delete('/:id', this.controller.delete.bind(this.controller));
  }
}