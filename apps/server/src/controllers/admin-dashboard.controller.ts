import { Request, Response, NextFunction } from 'express';
import { inject, injectable } from 'tsyringe';
import { AdminDashboardService } from '../services/admin-dashboard.service';

@injectable()
export class AdminDashboardController {
  constructor(@inject(AdminDashboardService) private dashboardService: AdminDashboardService) {}

  getDashboardStats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.dashboardService.getStats();
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  };
}
