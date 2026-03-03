import { Router } from 'express';
import { container } from 'tsyringe';
import { KitchenController } from '../controllers/kitchen.controller';
import { verifyUser } from '../middleware/authenticate.middleware';
import { adminOnly, requireModuleAccess } from '../middleware/admin.middleware';

export class KitchenRoutes {
  public router: Router;
  private controller: KitchenController;

  constructor() {
    this.router = Router();
    this.controller = container.resolve(KitchenController);
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/menu', this.controller.listPublicMenu);
    this.router.post('/orders', this.controller.createOrder);

    this.router.get(
      '/menu/admin',
      verifyUser,
      adminOnly,
      requireModuleAccess('kitchen'),
      this.controller.listAdminMenu
    );
    this.router.post(
      '/menu',
      verifyUser,
      adminOnly,
      requireModuleAccess('kitchen'),
      this.controller.createMenuItem
    );
    this.router.patch(
      '/menu/:menuId',
      verifyUser,
      adminOnly,
      requireModuleAccess('kitchen'),
      this.controller.updateMenuItem
    );
    this.router.delete(
      '/menu/:menuId',
      verifyUser,
      adminOnly,
      requireModuleAccess('kitchen'),
      this.controller.deleteMenuItem
    );

    this.router.get(
      '/orders',
      verifyUser,
      adminOnly,
      requireModuleAccess('kitchen'),
      this.controller.listOrders
    );
    this.router.patch(
      '/orders/:orderId/status',
      verifyUser,
      adminOnly,
      requireModuleAccess('kitchen'),
      this.controller.updateOrderStatus
    );
    this.router.patch(
      '/orders/:orderId/payment-status',
      verifyUser,
      adminOnly,
      requireModuleAccess('kitchen'),
      this.controller.updateOrderPaymentStatus
    );
  }
}
