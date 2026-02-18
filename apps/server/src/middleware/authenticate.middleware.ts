import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { IUserIndex } from '@quickprolaw/shared-interfaces';

// This interface is now obsolete because we are using declaration merging
// in `src/types/express.d.ts` to augment the global Express.Request type.
// It is kept here for reference but can be safely removed.

/**
 * Middleware to verify a Firebase ID token and authenticate the user.
 */
export const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  // 1. Check if the Authorization header is present and in the correct format.
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No token provided or token format is invalid.' });
  }

  // 2. Extract the ID token from the header.
  const idToken = authHeader.split('Bearer ')[1];

  try {
    // 3. Verify the ID token using the Firebase Admin SDK.
    // This also checks if the token is expired or revoked.
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // 4. Check for the firmId custom claim directly in the decoded token. This is much faster.
    if (!decodedToken['firmId'] || typeof decodedToken['firmId'] !== 'string') {
      return res.status(401).json({ success: false, message: 'Unauthorized: User is not associated with a firm.' });
    }

    // 5. Construct the user object from the token's claims. This object conforms to IUserIndex.
    const user: IUserIndex = {
      id: decodedToken.uid,
      firmId: decodedToken['firmId'],
      fullname: decodedToken['fullname'] || 'Unknown User',
      email: decodedToken.email || '',
      admin: decodedToken['admin'] || false,
      isSuperAdmin: decodedToken['isSuperAdmin'] || false,
      department: decodedToken['department'] || '',
      roles: decodedToken['roles'] || { canBill: false, canSchedule: false, canAssign: false, fileManager: false, librarian: false },
    };
    
    req.user = user;

    return next();
  } catch (error: any) {
    console.error('Authentication error:', error);
    // The token is invalid, expired, or revoked.
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid or expired token.' });
  }
};