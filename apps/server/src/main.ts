import * as dotenv from 'dotenv';
dotenv.config();
import 'reflect-metadata';
import express, { Application, Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import morgan from "morgan";
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { applyCorsMiddleware } from './config/cors';

// Import Infrastructure Services
import { FirestoreService } from './services/firestore.service';
container.resolve(FirestoreService);

// Import Middleware
import { verifyUser } from './middleware/authenticate.middleware';

// Import Core Routes
import { AuthRoutes } from './routes/auth.routes';
import { UserRoutes } from './routes/user.routes';
import { AppRoutes } from './routes/app.routes'; // Version/Download info
import { NotificationRoutes } from './routes/notification.routes';
import { AttachmentRoutes } from './routes/attachment.routes'; // Generic file handling
import { TenantRoutes } from './routes/tenants.routes'; // SaaS Multi-tenancy
// import { TaskRoutes } from './routes/task.routes'; // Optional: Keep if template includes Tasks

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

    if (process.env["NODE_ENV"] === 'development') {
      this.app.use(morgan('dev'));
    }
  }

  private routes(): void {
    const apiRouter = express.Router();

    // Rate Limiter
    const apiLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: 'Too many requests from this IP, please try again after 15 minutes',
    });
    apiRouter.use(apiLimiter);

    // Public Routes
    apiRouter.use('/auth', new AuthRoutes().router);
    apiRouter.use('/app', new AppRoutes().router);
    // apiRouter.use('/public', new PublicSyncRoutes().router); // Remove if specific to QuickProLaw

    // Protected Routes (Require Authentication)
    apiRouter.use(verifyUser);
    
    // Core Infrastructure
    apiRouter.use('/users', new UserRoutes().router);
    apiRouter.use('/notifications', new NotificationRoutes().router);
    apiRouter.use('/attachments', new AttachmentRoutes().router);
    apiRouter.use('/tenants', new TenantRoutes().router);
    
    // Optional / Example Features
    // apiRouter.use('/tasks', new TaskRoutes().router); 

    // Mount API
    this.app.use('/api', apiRouter);
  }

  private errorHandling(): void {
    this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      console.error(err);
      const status = err.status || 500;
      const message = err.message || 'Something went wrong on the server.';
      res.status(status).json({ success: false, message });
    });
  }
}

const app = new App().app;
const PORT = process.env["PORT"] || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));