import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { IUserIndex } from '@teddy-city-hotels/shared-interfaces';

const buildUserFromToken = (decodedToken: admin.auth.DecodedIdToken): IUserIndex => ({
  id: decodedToken.uid,
  firmId: (decodedToken['firmId'] as string) || 'teddy-city-hotels',
  fullname: (decodedToken['fullname'] as string) || decodedToken.name || 'Unknown User',
  email: decodedToken.email || '',
  admin: Boolean(decodedToken['admin']),
  isSuperAdmin: Boolean(decodedToken['isSuperAdmin']),
  department: (decodedToken['department'] as string) || '',
  roles: (decodedToken['roles'] as IUserIndex['roles']) || {
    canBill: false,
    canSchedule: false,
    canAssign: false,
    fileManager: false,
    librarian: false,
  },
  adminAccess: (decodedToken['adminAccess'] as IUserIndex['adminAccess']) || undefined,
});

export const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No token provided or token format is invalid.' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = buildUserFromToken(decodedToken);
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid or expired token.' });
  }
};

export const optionalVerifyUser = async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = buildUserFromToken(decodedToken);
  } catch (_error) {
    // Ignore token errors in optional mode.
  }

  return next();
};
