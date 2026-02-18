import cors from 'cors';
import { Application, Request, Response, NextFunction } from 'express';

// Define the allowed origins
const allowedOrigins = [
  'https://quickprolaw-cloud.web.app',
  'https://app-quickprolaw--quickprolaw-cloud.us-central1.hosted.app',
  'https://app.quickprolaw.com',
  'https://www.quickprolaw.com',
  'https://quickprolaw.com',
  'https://app.saxumlegal.ng',
  'https://saxumlegal.ng',
  'http://localhost:4200',
  'http://localhost:8100',
  'https://localhost',
  'capacitor://localhost',
  'ionic://localhost',
  'http://saxumlegal.ng',
];

const corsOptions: cors.CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      // Allow requests without an origin (e.g., Postman)
      callback(null, true);
    } else if (origin && allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origin not allowed'));
    }
  },
  credentials: true, // Allow credentials (cookies) for all allowed origins
  methods: ['OPTIONS', 'POST', 'GET', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'firmid'],
  maxAge: 600, // Cache preflight response for 10 minutes
  optionsSuccessStatus: 200,
};

// Apply CORS middleware to the Express app
export const applyCorsMiddleware = (app: Application) => {
  app.use(cors(corsOptions));


  
  // error handler for CORS errors
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err.message === 'Origin not allowed') {
      return res.status(403).json({ error: 'Origin not allowed' });
    }
   return next(err);
  });
};
