import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { RoomService } from '../services/room.service';

@injectable()
export class RoomController {
  constructor(@inject(RoomService) private roomService: RoomService) {}

  public getAllRooms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rooms = await this.roomService.getAllRooms();
      res.status(200).json(rooms);
    } catch (error) {
      next(error);
    }
  };

  public getRoomById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { roomId } = req.params;
      const room = await this.roomService.getRoomById(roomId);
      res.status(200).json(room);
    } catch (error) {
      next(error);
    }
  };
}
