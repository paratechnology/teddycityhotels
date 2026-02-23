import { Router } from 'express';
import { SnookerController } from '../controllers/snooker.controller';
import { container } from 'tsyringe';

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
    this.router.put('/players/:playerId', this.controller.updatePlayer);
    this.router.get('/matches', this.controller.getMatches);
    this.router.put('/matches/:matchId', this.controller.updateMatch);
  }
}
