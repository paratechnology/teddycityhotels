import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../errors/http-errors';

export const fileManagerOnly = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  if (user && (user.roles.fileManager || user.admin)) {
    next();
  } else {
    next(new ForbiddenError('Access denied. File Manager or admin privileges required.'));
  }
};