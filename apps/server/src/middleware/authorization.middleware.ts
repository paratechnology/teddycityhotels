import { Request, Response, NextFunction } from 'express';
 


export const canBill = (req: Request | any, res: Response, next: NextFunction) => {
    if (req.user.roles.canBill) {
      return next();
    }
    return res.status(401).json({
      success: false,
      status: 'Unauthorized',
      message: 'Billing clearance needed',
    });
  };

  export const canSchedule = (req: Request | any, res: Response, next: NextFunction) => {
    if (req.user.roles.canSchedule) {
      return next();
    }
    return res.status(401).json({
      success: false,
      status: 'Unauthorized',
      message: 'Scheduling clearance needed',
    });
  };
  

  
  