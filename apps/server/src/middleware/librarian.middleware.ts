import { Request,  Response, NextFunction } from 'express';
import { ForbiddenError } from '../errors/http-errors';

export const librarianOnly = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  if (user && (user.roles.librarian || user.admin)) {
    next();
  } else {
    next(new ForbiddenError('Access denied. Librarian or admin privileges required.'));
  }
};