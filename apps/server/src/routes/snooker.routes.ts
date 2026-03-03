import { Router } from 'express';
import { SnookerController } from '../controllers/snooker.controller';
import { container } from 'tsyringe';
import { adminOnly, requireModuleAccess } from '../middleware/admin.middleware';
import { verifyUser } from '../middleware/authenticate.middleware';

export class SnookerRoutes {
  public router: Router;
  private controller: SnookerController;

  constructor() {
    this.router = Router();
    this.controller = container.resolve(SnookerController);
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.controller.getLeagueData);
    this.router.get('/players', this.controller.getPlayers);
    this.router.get('/players/:playerId', this.controller.getPlayerById);
    this.router.get('/matches', this.controller.getMatches);
    this.router.get(
      '/competition',
      verifyUser,
      adminOnly,
      requireModuleAccess('snooker'),
      this.controller.getCompetitionState
    );

    this.router.post(
      '/competition',
      verifyUser,
      adminOnly,
      requireModuleAccess('snooker'),
      this.controller.createCompetition
    );
    this.router.post(
      '/competition/generate-groups',
      verifyUser,
      adminOnly,
      requireModuleAccess('snooker'),
      this.controller.generateGroups
    );
    this.router.post(
      '/competition/start-knockout',
      verifyUser,
      adminOnly,
      requireModuleAccess('snooker'),
      this.controller.startKnockoutStage
    );

    this.router.post(
      '/players',
      verifyUser,
      adminOnly,
      requireModuleAccess('snooker'),
      this.controller.createPlayer
    );
    this.router.put(
      '/players/:playerId',
      verifyUser,
      adminOnly,
      requireModuleAccess('snooker'),
      this.controller.updatePlayer
    );
    this.router.delete(
      '/players/:playerId',
      verifyUser,
      adminOnly,
      requireModuleAccess('snooker'),
      this.controller.deletePlayer
    );

    this.router.post(
      '/matches',
      verifyUser,
      adminOnly,
      requireModuleAccess('snooker'),
      this.controller.createMatch
    );
    this.router.put(
      '/matches/:matchId',
      verifyUser,
      adminOnly,
      requireModuleAccess('snooker'),
      this.controller.updateMatch
    );
    this.router.delete(
      '/matches/:matchId',
      verifyUser,
      adminOnly,
      requireModuleAccess('snooker'),
      this.controller.deleteMatch
    );
    this.router.post(
      '/matches/:matchId/result',
      verifyUser,
      adminOnly,
      requireModuleAccess('snooker'),
      this.controller.recordMatchResult
    );
  }
}
