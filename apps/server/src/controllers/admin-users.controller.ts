import { Request, Response, NextFunction } from 'express';
import { inject, injectable } from 'tsyringe';
import { AdminUsersService } from '../services/admin-users.service';

@injectable()
export class AdminUsersController {
  constructor(@inject(AdminUsersService) private adminUsersService: AdminUsersService) {}

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminUser = await this.adminUsersService.getAdminByAuthUid(req.user!.id);
      if (!adminUser) {
        res.status(200).json({
          id: req.user!.id,
          fullname: req.user!.fullname,
          email: req.user!.email,
          admin: req.user!.admin,
          isSuperAdmin: req.user!.isSuperAdmin,
          adminAccess: req.user!.adminAccess || {},
        });
        return;
      }
      res.status(200).json(adminUser);
    } catch (error) {
      next(error);
    }
  };

  list = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const admins = await this.adminUsersService.listAdmins();
      res.status(200).json(admins);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const admin = await this.adminUsersService.createAdmin(req.body);
      res.status(201).json(admin);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const admin = await this.adminUsersService.updateAdmin(req.params['adminId'], req.body);
      res.status(200).json(admin);
    } catch (error) {
      next(error);
    }
  };
}
