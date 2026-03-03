import { Request, Response, NextFunction } from 'express';
import { inject, injectable } from 'tsyringe';
import {
  ICreateKitchenMenuItemDto,
  ICreateKitchenOrderDto,
  IUpdateKitchenMenuItemDto,
  IUpdateKitchenOrderPaymentStatusDto,
  IUpdateKitchenOrderStatusDto,
  KitchenOrderPaymentMethod,
  KitchenOrderPaymentStatus,
  KitchenOrderStatus,
} from '@teddy-city-hotels/shared-interfaces';
import { KitchenService } from '../services/kitchen.service';

@injectable()
export class KitchenController {
  constructor(@inject(KitchenService) private kitchenService: KitchenService) {}

  public listPublicMenu = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rows = await this.kitchenService.listPublicMenu();
      res.status(200).json(rows);
    } catch (error) {
      next(error);
    }
  };

  public createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = req.body as ICreateKitchenOrderDto;
      const row = await this.kitchenService.createOrder(payload);
      res.status(201).json(row);
    } catch (error) {
      next(error);
    }
  };

  public listAdminMenu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Number(req.query['page'] || 1);
      const pageSize = Number(req.query['pageSize'] || 12);
      const search = req.query['search'] as string | undefined;
      const category = req.query['category'] as string | undefined;
      const available = req.query['available'] as string | undefined;

      const rows = await this.kitchenService.listAdminMenu({ page, pageSize, search, category, available });
      res.status(200).json(rows);
    } catch (error) {
      next(error);
    }
  };

  public createMenuItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = req.body as ICreateKitchenMenuItemDto;
      const row = await this.kitchenService.createMenuItem(payload);
      res.status(201).json(row);
    } catch (error) {
      next(error);
    }
  };

  public updateMenuItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = req.body as IUpdateKitchenMenuItemDto;
      const row = await this.kitchenService.updateMenuItem(req.params['menuId'], payload);
      res.status(200).json(row);
    } catch (error) {
      next(error);
    }
  };

  public deleteMenuItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.kitchenService.deleteMenuItem(req.params['menuId']);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  public listOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Number(req.query['page'] || 1);
      const pageSize = Number(req.query['pageSize'] || 12);
      const search = req.query['search'] as string | undefined;
      const orderStatus = req.query['orderStatus'] as KitchenOrderStatus | undefined;
      const paymentStatus = req.query['paymentStatus'] as KitchenOrderPaymentStatus | undefined;
      const paymentMethod = req.query['paymentMethod'] as KitchenOrderPaymentMethod | undefined;

      const rows = await this.kitchenService.listOrders({
        page,
        pageSize,
        search,
        orderStatus,
        paymentStatus,
        paymentMethod,
      });
      res.status(200).json(rows);
    } catch (error) {
      next(error);
    }
  };

  public updateOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = req.body as IUpdateKitchenOrderStatusDto;
      const row = await this.kitchenService.updateOrderStatus(req.params['orderId'], payload.orderStatus);
      res.status(200).json(row);
    } catch (error) {
      next(error);
    }
  };

  public updateOrderPaymentStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const payload = req.body as IUpdateKitchenOrderPaymentStatusDto;
      const row = await this.kitchenService.updateOrderPaymentStatus(
        req.params['orderId'],
        payload.paymentStatus
      );
      res.status(200).json(row);
    } catch (error) {
      next(error);
    }
  };
}
