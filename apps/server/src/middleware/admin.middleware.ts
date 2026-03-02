import { Request, Response, NextFunction } from 'express';
import { AdminModuleKey, IUserIndex } from '@teddy-city-hotels/shared-interfaces';
import { ForbiddenError, UnauthorizedError } from '../errors/http-errors';

export const adminOnly = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required.'));
  }

  const user = req.user as IUserIndex;
  if (user.admin || user.isSuperAdmin) {
    return next();
  }

  return next(new ForbiddenError('Forbidden: Administrator access required.'));
};

export const requireModuleAccess = (moduleKey: AdminModuleKey) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required.'));
    }

    const user = req.user as IUserIndex;
    if (user.isSuperAdmin) {
      return next();
    }

    if (!user.admin) {
      return next(new ForbiddenError('Administrator access required.'));
    }

    if (!user.adminAccess || user.adminAccess[moduleKey]) {
      return next();
    }

    return next(new ForbiddenError(`No access to ${moduleKey} module.`));
  };
};
