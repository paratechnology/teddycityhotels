import { Router } from 'express';
import { RoomController } from '../controllers/room.controller';
import { container } from 'tsyringe';
import { verifyUser } from '../middleware/authenticate.middleware';
import { adminOnly, requireModuleAccess } from '../middleware/admin.middleware';

export class RoomRoutes {
  public router: Router;
  private controller: RoomController;

  constructor() {
    this.router = Router();
    this.controller = container.resolve(RoomController);
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.controller.getAllRooms);
    this.router.get('/:roomId', this.controller.getRoomById);

    this.router.post(
      '/',
      verifyUser,
      adminOnly,
      requireModuleAccess('rooms'),
      this.controller.createRoom
    );
    this.router.put(
      '/:roomId',
      verifyUser,
      adminOnly,
      requireModuleAccess('rooms'),
      this.controller.updateRoom
    );
    this.router.delete(
      '/:roomId',
      verifyUser,
      adminOnly,
      requireModuleAccess('rooms'),
      this.controller.deleteRoom
    );
  }
}
