import * as dotenv from 'dotenv';
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
import { AppRoutes } from './routes/app.routes';
import { RoomRoutes } from './routes/room.routes';
import { BookingRoutes } from './routes/booking.routes';
import { PaymentRoutes } from './routes/payment.routes';
import { NotificationRoutes } from './routes/notification.routes';
import { AttachmentRoutes } from './routes/attachment.routes';
import { SnookerRoutes } from './routes/snooker.routes';
import { FinancialsRoutes } from './routes/financials.routes';
import { AdminDashboardRoutes } from './routes/admin-dashboard.routes';
import { AdminUsersRoutes } from './routes/admin-users.routes';
import { KitchenRoutes } from './routes/kitchen.routes';
import { ContactRoutes } from './routes/contact.routes';
import { SwimmingRoutes } from './routes/swimming.routes';

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.config();
    this.routes();
    this.errorHandling();
  }

  private config(): void {
    const jsonParser = express.json();
    const urlencodedParser = express.urlencoded({ extended: true });

    this.app.use(helmet());
    this.app.set('trust proxy', 1);
    applyCorsMiddleware(this.app);
    this.app.use((req, res, next) => {
      if (req.path === '/api/payments/webhook') {
        return express.raw({ type: 'application/json' })(req, res, next);
      }
      return jsonParser(req, res, next);
    });
    this.app.use((req, res, next) => {
      if (req.path === '/api/payments/webhook') {
        return next();
      }
      return urlencodedParser(req, res, next);
    });

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
    apiRouter.use('/contact', new ContactRoutes().router);
    apiRouter.use('/swimming', new SwimmingRoutes().router);

    // Protected/managed routes (guarded inside each route module)
    apiRouter.use('/notifications', new NotificationRoutes().router);
    apiRouter.use('/attachments', new AttachmentRoutes().router);
    apiRouter.use('/financials', new FinancialsRoutes().router);
    apiRouter.use('/kitchen', new KitchenRoutes().router);
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
