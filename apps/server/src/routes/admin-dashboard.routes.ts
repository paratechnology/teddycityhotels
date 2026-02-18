import { verifyUser } from '../middleware/authenticate.middleware';
import { AdminDashboardController } from '../controllers/admin-dashboard.controller';
import express from 'express';
import { container } from 'tsyringe';
import { verifySubscription } from '../middleware/subscription.middleware';

const adminDashboardRouter = express.Router();
adminDashboardRouter.use(express.json());
const adminDashboardController = container.resolve(AdminDashboardController);

// All dashboard routes are protected
adminDashboardRouter.use(verifyUser as any, verifySubscription as any);

// A single endpoint to get all aggregated data for the dashboard
adminDashboardRouter.route('/')
    .get(adminDashboardController.getDashboardStats);

export default adminDashboardRouter;