import { inject, injectable } from 'tsyringe';
import { FirestoreService } from './firestore.service';
import { IFinancialExpense, IFinancialOverview, IPayrollEntry, IRevenuePoint } from '@teddy-city-hotels/shared-interfaces';
import { Booking } from '@teddy-city-hotels/shared-interfaces';

@injectable()
export class FinancialsService {
  constructor(@inject(FirestoreService) private firestore: FirestoreService) {}

  private getBookingsCollection() {
    return this.firestore.db.collection('bookings');
  }

  private getExpensesCollection() {
    return this.firestore.db.collection('financialExpenses');
  }

  private getPayrollCollection() {
    return this.firestore.db.collection('financialPayroll');
  }

  private normalizeDate(input: unknown): Date {
    if (input instanceof Date) return input;
    if (typeof input === 'string') return new Date(input);
    if (input && typeof input === 'object' && 'toDate' in (input as { toDate: () => Date })) {
      return (input as { toDate: () => Date }).toDate();
    }
    return new Date();
  }

  private toDayKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private toMonthKey(date: Date): string {
    return date.toISOString().slice(0, 7);
  }

  async createExpense(expense: Omit<IFinancialExpense, 'id' | 'createdAt'>): Promise<IFinancialExpense> {
    const ref = this.getExpensesCollection().doc();
    const next: IFinancialExpense = {
      id: ref.id,
      ...expense,
      createdAt: new Date().toISOString(),
    };
    await ref.set(next);
    return next;
  }

  async listExpenses(): Promise<IFinancialExpense[]> {
    const snapshot = await this.getExpensesCollection().orderBy('incurredOn', 'desc').limit(200).get();
    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as IFinancialExpense));
  }

  async addPayrollEntry(entry: Omit<IPayrollEntry, 'id' | 'createdAt' | 'status'>): Promise<IPayrollEntry> {
    const ref = this.getPayrollCollection().doc();
    const next: IPayrollEntry = {
      id: ref.id,
      ...entry,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    await ref.set(next);
    return next;
  }

  async markPayrollPaid(payrollId: string): Promise<void> {
    await this.getPayrollCollection().doc(payrollId).update({ status: 'paid' });
  }

  async listPayroll(): Promise<IPayrollEntry[]> {
    const snapshot = await this.getPayrollCollection().orderBy('month', 'desc').limit(200).get();
    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as IPayrollEntry));
  }

  async getOverview(): Promise<IFinancialOverview> {
    const [bookingsSnap, expenses, payroll] = await Promise.all([
      this.getBookingsCollection().where('status', 'in', ['confirmed', 'checked_in', 'checked_out']).get(),
      this.listExpenses(),
      this.listPayroll(),
    ]);

    const bookings = bookingsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Booking));

    const dailyBuckets = new Map<string, number>();
    const monthlyBuckets = new Map<string, number>();

    let totalRevenue = 0;
    for (const booking of bookings) {
      const created = this.normalizeDate(booking.createdAt);
      const total = Number(booking.totalPrice || 0);
      totalRevenue += total;

      const dayKey = this.toDayKey(created);
      dailyBuckets.set(dayKey, (dailyBuckets.get(dayKey) || 0) + total);

      const monthKey = this.toMonthKey(created);
      monthlyBuckets.set(monthKey, (monthlyBuckets.get(monthKey) || 0) + total);
    }

    const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const dailyRevenue: IRevenuePoint[] = Array.from(dailyBuckets.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);

    const monthlyRevenue: IRevenuePoint[] = Array.from(monthlyBuckets.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-12);

    return {
      totalRevenue,
      totalExpenses,
      netIncome: totalRevenue - totalExpenses,
      dailyRevenue,
      monthlyRevenue,
      recentExpenses: expenses.slice(0, 20),
      payroll,
    };
  }

  async exportMonthlyCsv(month: string): Promise<string> {
    const overview = await this.getOverview();
    const monthRevenue = overview.monthlyRevenue.find((item) => item.date === month)?.amount || 0;
    const monthExpenses = overview.recentExpenses
      .filter((expense) => (expense.incurredOn || '').startsWith(month))
      .reduce((sum, expense) => sum + expense.amount, 0);
    const monthPayroll = overview.payroll
      .filter((entry) => entry.month === month)
      .reduce((sum, entry) => sum + entry.amount, 0);

    const lines = [
      'month,revenue,expenses,payroll,net',
      `${month},${monthRevenue},${monthExpenses},${monthPayroll},${monthRevenue - monthExpenses - monthPayroll}`,
    ];

    return lines.join('\n');
  }
}
