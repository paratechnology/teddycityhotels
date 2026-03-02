import { Request, Response, NextFunction } from 'express';
import { injectable } from 'tsyringe';

@injectable()
export class FirmController {
  requestFirmDeletion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({ message: 'Deletion request recorded.' });
    } catch (error) {
      next(error);
    }
  };

  completeFirmDeletion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({ message: 'Deletion confirmation received.' });
    } catch (error) {
      next(error);
    }
  };
}
