import {  Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { FirestoreService } from '../services/firestore.service';
import { ForbiddenError, UnauthorizedError } from '../errors/http-errors';

/**
 * Middleware to check if the firm associated with the request has an active subscription.
 * It resolves the FirestoreService from the tsyringe container to perform the check.
 */
export const verifySubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Ensure a user object with firmId is attached to the request by a preceding auth middleware.
    if (!req.user?.firmId) {
      return next(new UnauthorizedError('Authentication details are missing.'));
    }

    const firmId = req.user.firmId;

    // Manually resolve the FirestoreService instance from the global container.
    // This is the pattern for accessing dependencies outside of constructor injection.
    const firestoreService = container.resolve(FirestoreService);

    const firmDoc = await firestoreService.db.collection('firms').doc(firmId).get();

    if (!firmDoc.exists) {
      return next(new ForbiddenError('Firm not found.'));
    }

    const firmData = firmDoc.data();
    const subscriptionStatus = firmData?.subscriptionStatus;

    if (subscriptionStatus !== 'active' && subscriptionStatus !== 'trialing') {
      return next(new ForbiddenError('Your subscription is not active. Please update your billing information.'));
    }

    next();
  } catch (error) {
    next(error);
  }
};