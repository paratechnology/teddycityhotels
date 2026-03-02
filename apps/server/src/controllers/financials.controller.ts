import { Request, Response, NextFunction } from 'express';
import { inject, injectable } from 'tsyringe';
import { FinancialsService } from '../services/financials.service';

@injectable()
export class FinancialsController {
  constructor(@inject(FinancialsService) private financialsService: FinancialsService) {}

  getOverview = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.financialsService.getOverview();
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  createExpense = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const expense = await this.financialsService.createExpense(req.body);
      res.status(201).json(expense);
    } catch (error) {
      next(error);
    }
  };

  listExpenses = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const expenses = await this.financialsService.listExpenses();
      res.status(200).json(expenses);
    } catch (error) {
      next(error);
    }
  };

  addPayrollEntry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entry = await this.financialsService.addPayrollEntry(req.body);
      res.status(201).json(entry);
    } catch (error) {
      next(error);
    }
  };

  listPayroll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const payroll = await this.financialsService.listPayroll();
      res.status(200).json(payroll);
    } catch (error) {
      next(error);
    }
  };

  markPayrollPaid = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.financialsService.markPayrollPaid(req.params['payrollId']);
      res.status(200).json({ message: 'Payroll marked as paid.' });
    } catch (error) {
      next(error);
    }
  };

  exportMonthlyCsv = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const month = (req.query['month'] as string) || new Date().toISOString().slice(0, 7);
      const csv = await this.financialsService.exportMonthlyCsv(month);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="financial-report-${month}.csv"`);
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  };
}
