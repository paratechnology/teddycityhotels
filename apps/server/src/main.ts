import * as dotenv from 'dotenv';
dotenv.config({ path: process.env['ENV_FILE'] || 'apps/server/.env' });
dotenv.config();
import 'reflect-metadata';
import express, { Application, Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { applyCorsMiddleware } from './config/cors';

import { FirestoreService } from './services/firestore.service';
container.resolve(FirestoreService);

import { AuthRoutes } from './routes/auth.routes';
import { UserRoutes } from './routes/user.routes';
import { AppRoutes } from './routes/app.routes';
import { RoomRoutes } from './routes/room.routes';
import { BookingRoutes } from './routes/booking.routes';
import { PaymentRoutes } from './routes/payment.routes';
import { NotificationRoutes } from './routes/notification.routes';
import { AttachmentRoutes } from './routes/attachment.routes';
import { TenantRoutes } from './routes/tenants.routes';
import { SnookerRoutes } from './routes/snooker.routes';
import { FinancialsRoutes } from './routes/financials.routes';
import { AdminDashboardRoutes } from './routes/admin-dashboard.routes';
import { AdminUsersRoutes } from './routes/admin-users.routes';

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.config();
    this.routes();
    this.errorHandling();
  }

  private config(): void {
    this.app.use(helmet());
    this.app.set('trust proxy', 1);
    applyCorsMiddleware(this.app);
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    if (process.env['NODE_ENV'] === 'development') {
      this.app.use(morgan('dev'));
    }
  }

  private routes(): void {
    const apiRouter = express.Router();

    const apiLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: 'Too many requests from this IP, please try again after 15 minutes',
    });
    apiRouter.use(apiLimiter);

    // Public routes
    apiRouter.use('/auth', new AuthRoutes().router);
    apiRouter.use('/app', new AppRoutes().router);
    apiRouter.use('/rooms', new RoomRoutes().router);
    apiRouter.use('/snooker', new SnookerRoutes().router);
    apiRouter.use('/bookings', new BookingRoutes().router);
    apiRouter.use('/payments', new PaymentRoutes().router);

    // Protected/managed routes (guarded inside each route module)
    apiRouter.use('/users', new UserRoutes().router);
    apiRouter.use('/notifications', new NotificationRoutes().router);
    apiRouter.use('/attachments', new AttachmentRoutes().router);
    apiRouter.use('/tenants', new TenantRoutes().router);
    apiRouter.use('/financials', new FinancialsRoutes().router);
    apiRouter.use('/admin/dashboard', new AdminDashboardRoutes().router);
    apiRouter.use('/admin/users', new AdminUsersRoutes().router);

    this.app.use('/api', apiRouter);
  }

  private errorHandling(): void {
    this.app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.statusCode || err.status || 500;
      const message = err.message || 'Something went wrong on the server.';
      res.status(status).json({ success: false, message });
    });
  }
}

const app = new App().app;
const PORT = process.env['PORT'] || 8080;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
