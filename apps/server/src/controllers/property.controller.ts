import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { PropertyService } from '../services/property.service';

@injectable()
export class PropertyController {
  constructor(@inject(PropertyService) private service: PropertyService) {}

  public list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const properties = await this.service.listPublic();
      res.status(200).json(properties);
    } catch (error) {
      next(error);
    }
  };

  public listAdmin = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const properties = await this.service.listAll();
      res.status(200).json(properties);
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const property = await this.service.getById(req.params['id']);
      res.status(200).json(property);
    } catch (error) {
      next(error);
    }
  };

  public getBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const property = await this.service.getBySlug(req.params['slug']);
      res.status(200).json(property);
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const property = await this.service.create(req.body);
      res.status(201).json(property);
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const property = await this.service.update(req.params['id'], req.body);
      res.status(200).json(property);
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.delete(req.params['id']);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
