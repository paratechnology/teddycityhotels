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
  }
}
