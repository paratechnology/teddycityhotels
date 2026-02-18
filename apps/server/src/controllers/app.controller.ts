import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { FirestoreService } from '../services/firestore.service';
import { NotFoundError } from '../errors/http-errors';

@injectable()
export class AppController {
  constructor(@inject(FirestoreService) private firestore: FirestoreService) {}

  public getVersionInfo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const versionDoc = await this.firestore.db.collection('defaults').doc('app-version').get();
      if (!versionDoc.exists) {
        throw new NotFoundError('App version information not found.');
      }
      const data = versionDoc.data();
      
      // Transform the data to the format expected by @capawesome/capacitor-app-update
      const response = {
        version: data?.android?.versionCode,
        url: data?.android?.apkUrl,
        // The 'size' property is optional but good to have. We can add it later if needed.
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  public getDownloadLinks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const versionDoc = await this.firestore.db.collection('defaults').doc('app-version').get();
      if (!versionDoc.exists) {
        throw new NotFoundError('App version information not found.');
      }
      // Return the entire document data, which contains all platform links
      res.status(200).json(versionDoc.data());
    } catch (error) {
      next(error);
    }
  };
}