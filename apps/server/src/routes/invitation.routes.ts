import { Router } from 'express';

export class InvitationRoutes {
  public router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', (_req, res) => {
      res.status(200).json({ invitations: [] });
    });
  }
}
