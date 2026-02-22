import { Router } from 'express';
import { RoomController } from '../controllers/room.controller';
import { container } from 'tsyringe';

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
  }
}
