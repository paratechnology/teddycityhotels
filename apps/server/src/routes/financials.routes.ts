import { Router } from 'express';
import { container } from 'tsyringe';
import { FinancialsController } from '../controllers/financials.controller';
import { verifyUser } from '../middleware/authenticate.middleware';
import { adminOnly, requireModuleAccess } from '../middleware/admin.middleware';

export class FinancialsRoutes {
  public router: Router;
  private controller: FinancialsController;

  constructor() {
    this.router = Router();
    this.controller = container.resolve(FinancialsController);
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use(verifyUser, adminOnly, requireModuleAccess('financials'));

    this.router.get('/overview', this.controller.getOverview);
    this.router.get('/revenue', this.controller.listRevenue);
    this.router.post('/revenue', this.controller.createRevenueRecord);
    this.router.patch('/revenue/:revenueId/payment-status', this.controller.updateRevenuePaymentStatus);
    this.router.get('/expenses', this.controller.listExpenses);
    this.router.post('/expenses', this.controller.createExpense);
    this.router.get('/payroll', this.controller.listPayroll);
    this.router.post('/payroll', this.controller.addPayrollEntry);
    this.router.patch('/payroll/:payrollId/pay', this.controller.markPayrollPaid);
    this.router.get('/exports/monthly', this.controller.exportMonthlyCsv);
  }
}
