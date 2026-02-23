import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { SnookerService } from '../services/snooker.service';

@injectable()
export class SnookerController {
  constructor(@inject(SnookerService) private snookerService: SnookerService) {}

  public getLeagueData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.snookerService.getLeagueData();
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  public getPlayers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const players = await this.snookerService.getPlayers();
      res.status(200).json(players);
    } catch (error) {
      next(error);
    }
  };

  public getPlayerById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { playerId } = req.params;
      const player = await this.snookerService.getPlayerById(playerId);
      res.status(200).json(player);
    } catch (error) {
      next(error);
    }
  };

  public updatePlayer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { playerId } = req.params;
      const player = await this.snookerService.updatePlayer(playerId, req.body);
      res.status(200).json(player);
    } catch (error) {
      next(error);
    }
  };

    public getMatches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const matches = await this.snookerService.getMatches();
      res.status(200).json(matches);
    } catch (error) {
      next(error);
    }
  };

  public updateMatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { matchId } = req.params;
      const match = await this.snookerService.updateMatch(matchId, req.body);
      res.status(200).json(match);
    } catch (error) {
      next(error);
    }
  };
}
