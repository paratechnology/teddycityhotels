import { Request, Response, NextFunction } from 'express';
import { IFirmUser } from '@quickprolaw/shared-interfaces';
import { ForbiddenError, UnauthorizedError } from '../errors/http-errors';

/**
 * Middleware to ensure the user is a firm administrator (admin flag or partner designation).
 */
export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  // First, ensure the user object exists (i.e., verifyUser middleware has run successfully)
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required.'));
  }

  const user = req.user as IFirmUser; // We can still cast here for type-specific properties like isSuperAdmin
  // Check if user exists and has admin privileges
  if (user && (user.admin) || user.isSuperAdmin) {
    // console.log('admin detected', user);
    return next();
  }
  
  // If not an admin, send a forbidden error
  return next(new ForbiddenError('Forbidden: Administrator access required.'));
};