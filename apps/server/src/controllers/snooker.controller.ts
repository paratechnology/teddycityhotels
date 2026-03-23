import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { SnookerService } from '../services/snooker.service';
import {
  ICreatePublicSnookerRegistrationDto,
  ICreateSnookerCompetitionDto,
  IGenerateSnookerGroupsDto,
  IRecordSnookerResultDto,
} from '@teddy-city-hotels/shared-interfaces';

@injectable()
export class SnookerController {
  constructor(@inject(SnookerService) private snookerService: SnookerService) {}

  public getLeagueData = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.snookerService.getLeagueData();
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  public getCompetitionState = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const playersPage = Number(req.query['playersPage'] || req.query['page'] || 1);
      const playersPageSize = Number(req.query['playersPageSize'] || req.query['pageSize'] || 12);
      const playersSearch = req.query['playersSearch'] as string | undefined;
      const matchesPage = Number(req.query['matchesPage'] || 1);
      const matchesPageSize = Number(req.query['matchesPageSize'] || 12);

      const data = await this.snookerService.getCompetitionState({
        playersPage,
        playersPageSize,
        playersSearch,
        matchesPage,
        matchesPageSize,
      });
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  public createCompetition = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = req.body as ICreateSnookerCompetitionDto;
      const data = await this.snookerService.createCompetition(payload);
      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  };

  public generateGroups = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = req.body as IGenerateSnookerGroupsDto;
      const data = await this.snookerService.generateGroups(payload);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  public startKnockoutStage = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.snookerService.startKnockoutStage();
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  public getPlayers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const hasPaging =
        req.query['page'] !== undefined || req.query['pageSize'] !== undefined || req.query['search'] !== undefined;
      if (hasPaging) {
        const page = Number(req.query['page'] || 1);
        const pageSize = Number(req.query['pageSize'] || 12);
        const search = req.query['search'] as string | undefined;
        const paged = await this.snookerService.getPlayersPaginated({ page, pageSize, search });
        res.status(200).json(paged);
        return;
      }

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

  public createPlayer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const player = await this.snookerService.createPlayer(req.body);
      res.status(201).json(player);
    } catch (error) {
      next(error);
    }
  };

  public registerPublicPlayer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const player = await this.snookerService.initializePublicRegistration(
        req.body as ICreatePublicSnookerRegistrationDto
      );
      res.status(201).json(player);
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

  public deletePlayer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { playerId } = req.params;
      await this.snookerService.deletePlayer(playerId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  public getMatches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const hasPaging = req.query['page'] !== undefined || req.query['pageSize'] !== undefined;
      if (hasPaging) {
        const page = Number(req.query['page'] || 1);
        const pageSize = Number(req.query['pageSize'] || 12);
        const paged = await this.snookerService.getMatchesPaginated({ page, pageSize });
        res.status(200).json(paged);
        return;
      }

      const matches = await this.snookerService.getMatches();
      res.status(200).json(matches);
    } catch (error) {
      next(error);
    }
  };

  public createMatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const match = await this.snookerService.createMatch(req.body);
      res.status(201).json(match);
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

  public deleteMatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { matchId } = req.params;
      await this.snookerService.deleteMatch(matchId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  public recordMatchResult = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { matchId } = req.params;
      const payload = req.body as IRecordSnookerResultDto;
      const data = await this.snookerService.recordMatchResult(matchId, payload);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };
}
