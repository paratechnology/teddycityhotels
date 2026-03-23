import { inject, injectable } from 'tsyringe';
import { FirestoreService } from './firestore.service';
import {
  Booking,
  ICreateRevenueRecordDto,
  IFinancialExpense,
  IFinancialOverview,
  IKitchenOrder,
  IPayrollEntry,
  IRevenueListResponse,
  IRevenuePoint,
  IRevenueRecord,
  ISnookerPlayer,
  ISwimmingBooking,
  RevenuePaymentMethod,
  RevenuePaymentStatus,
  RevenueSourceType,
} from '@teddy-city-hotels/shared-interfaces';
import { BadRequestError, NotFoundError } from '../errors/http-errors';

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

  private getRevenueCollection() {
    return this.firestore.db.collection('financialRevenue');
  }

  private normalizeDate(input: unknown): Date {
    if (input instanceof Date) return input;
    if (typeof input === 'string') {
      const parsed = new Date(input);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
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

  private normalizePaging(params: { page?: number; pageSize?: number }) {
    return {
      page: Number.isFinite(params.page) ? Math.max(1, Number(params.page)) : 1,
      pageSize: Number.isFinite(params.pageSize)
        ? Math.min(100, Math.max(1, Number(params.pageSize)))
        : 12,
    };
  }

  private parseAmount(input: unknown): number {
    const amount = Number(input);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestError('Amount must be a valid number greater than zero.');
    }
    return Math.round(amount * 100) / 100;
  }

  private isPaidStatus(status: RevenuePaymentStatus): boolean {
    return status === 'paid';
  }

  private async getAllRevenueRecords(): Promise<IRevenueRecord[]> {
    const snapshot = await this.getRevenueCollection().orderBy('createdAt', 'desc').get();
    if (snapshot.empty) return [];
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as IRevenueRecord));
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
    const snapshot = await this.getExpensesCollection().orderBy('incurredOn', 'desc').limit(300).get();
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
    const snapshot = await this.getPayrollCollection().orderBy('month', 'desc').limit(300).get();
    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as IPayrollEntry));
  }

  async createRevenueRecord(input: ICreateRevenueRecordDto): Promise<IRevenueRecord> {
    const description = input.description?.trim();
    if (!description) {
      throw new BadRequestError('Description is required.');
    }

    const amount = this.parseAmount(input.amount);
    const paymentMethod: RevenuePaymentMethod = input.paymentMethod || 'cash';
    const paymentStatus: RevenuePaymentStatus = input.paymentStatus || 'paid';
    const now = new Date().toISOString();

    const ref = this.getRevenueCollection().doc();
    const next: IRevenueRecord = {
      id: ref.id,
      sourceType: input.sourceType,
      description,
      amount,
      paymentMethod,
      paymentStatus,
      relatedId: input.relatedId,
      createdAt: now,
      updatedAt: now,
      receivedAt: this.isPaidStatus(paymentStatus)
        ? input.receivedAt || now
        : undefined,
    };

    await ref.set(next);
    return next;
  }

  async updateRevenuePaymentStatus(revenueId: string, paymentStatus: RevenuePaymentStatus): Promise<IRevenueRecord> {
    const ref = this.getRevenueCollection().doc(revenueId);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new NotFoundError('Revenue record not found.');
    }

    const now = new Date().toISOString();
    await ref.set(
      {
        paymentStatus,
        updatedAt: now,
        receivedAt: paymentStatus === 'paid' ? now : null,
      },
      { merge: true }
    );

    const next = await ref.get();
    return { id: next.id, ...next.data() } as IRevenueRecord;
  }

  async getRevenueList(params: {
    page?: number;
    pageSize?: number;
    sourceType?: RevenueSourceType;
    paymentStatus?: RevenuePaymentStatus;
    paymentMethod?: RevenuePaymentMethod;
    search?: string;
  }): Promise<IRevenueListResponse> {
    const paging = this.normalizePaging(params);
    await this.syncBookingRevenueFromBookings();

    const rows = await this.getAllRevenueRecords();

    let filtered = rows;
    if (params.sourceType) {
      filtered = filtered.filter((row) => row.sourceType === params.sourceType);
    }
    if (params.paymentStatus) {
      filtered = filtered.filter((row) => row.paymentStatus === params.paymentStatus);
    }
    if (params.paymentMethod) {
      filtered = filtered.filter((row) => row.paymentMethod === params.paymentMethod);
    }
    if (params.search?.trim()) {
      const search = params.search.trim().toLowerCase();
      filtered = filtered.filter((row) => {
        return (
          row.description.toLowerCase().includes(search) ||
          (row.relatedId || '').toLowerCase().includes(search) ||
          row.sourceType.toLowerCase().includes(search)
        );
      });
    }

    const total = filtered.length;
    const start = (paging.page - 1) * paging.pageSize;
    const data = filtered.slice(start, start + paging.pageSize);

    const paidBySource: Record<RevenueSourceType, number> = {
      booking: 0,
      snooker_registration: 0,
      food_and_beverage: 0,
      swimming: 0,
      manual: 0,
    };

    for (const row of rows) {
      if (row.paymentStatus !== 'paid') continue;
      paidBySource[row.sourceType] = (paidBySource[row.sourceType] || 0) + Number(row.amount || 0);
    }

    const totalPaidRevenue = rows
      .filter((row) => row.paymentStatus === 'paid')
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);

    const pendingRevenue = rows
      .filter((row) => row.paymentStatus === 'pending')
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);

    return {
      rows: {
        data,
        total,
        page: paging.page,
        pageSize: paging.pageSize,
      },
      summary: {
        totalPaidRevenue,
        pendingRevenue,
        paidBySource,
      },
    };
  }

  async upsertBookingRevenue(booking: Booking): Promise<void> {
    const snapshot = await this.getRevenueCollection()
      .where('sourceType', '==', 'booking')
      .where('relatedId', '==', booking.id)
      .limit(1)
      .get();

    const paidStatuses = ['confirmed', 'checked_in', 'checked_out'];
    const isPaidBooking = paidStatuses.includes(booking.status);
    const paymentStatus: RevenuePaymentStatus = isPaidBooking
      ? 'paid'
      : booking.status === 'cancelled'
      ? 'refunded'
      : 'pending';

    const now = new Date().toISOString();
    const payload: Partial<IRevenueRecord> = {
      sourceType: 'booking',
      relatedId: booking.id,
      description: `Booking ${booking.id} (${booking.guestName || booking.userId || 'Guest'})`,
      amount: Number(booking.totalPrice || 0),
      paymentMethod: booking.source === 'admin' ? 'cash' : 'online',
      paymentStatus,
      updatedAt: now,
      receivedAt: paymentStatus === 'paid' ? now : undefined,
    };

    if (snapshot.empty) {
      if (!isPaidBooking) return;

      const ref = this.getRevenueCollection().doc();
      const next: IRevenueRecord = {
        id: ref.id,
        sourceType: 'booking',
        relatedId: booking.id,
        description: String(payload.description),
        amount: Number(payload.amount || 0),
        paymentMethod: (payload.paymentMethod as RevenuePaymentMethod) || 'online',
        paymentStatus,
        createdAt: now,
        updatedAt: now,
        receivedAt: paymentStatus === 'paid' ? now : undefined,
      };
      await ref.set(next);
      return;
    }

    const doc = snapshot.docs[0];
    await doc.ref.set(payload, { merge: true });
  }

  async upsertKitchenOrderRevenue(order: IKitchenOrder): Promise<void> {
    const snapshot = await this.getRevenueCollection()
      .where('sourceType', '==', 'food_and_beverage')
      .where('relatedId', '==', order.id)
      .limit(1)
      .get();

    const now = new Date().toISOString();
    const paymentStatus: RevenuePaymentStatus = order.paymentStatus;

    const payload: Partial<IRevenueRecord> = {
      sourceType: 'food_and_beverage',
      relatedId: order.id,
      description: `Kitchen order ${order.id} (${order.customerName})`,
      amount: Number(order.totalAmount || 0),
      paymentMethod: order.paymentMethod,
      paymentStatus,
      updatedAt: now,
      receivedAt: paymentStatus === 'paid' ? now : undefined,
    };

    if (snapshot.empty) {
      if (paymentStatus !== 'paid') return;

      const ref = this.getRevenueCollection().doc();
      const next: IRevenueRecord = {
        id: ref.id,
        sourceType: 'food_and_beverage',
        relatedId: order.id,
        description: String(payload.description),
        amount: Number(payload.amount || 0),
        paymentMethod: (payload.paymentMethod as RevenuePaymentMethod) || 'cash',
        paymentStatus,
        createdAt: now,
        updatedAt: now,
        receivedAt: now,
      };
      await ref.set(next);
      return;
    }

    const doc = snapshot.docs[0];
    await doc.ref.set(payload, { merge: true });
  }

  async upsertSnookerRegistrationRevenue(player: ISnookerPlayer, amount: number): Promise<void> {
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return;
    }

    const snapshot = await this.getRevenueCollection()
      .where('sourceType', '==', 'snooker_registration')
      .where('relatedId', '==', player.id)
      .limit(1)
      .get();

    const now = new Date().toISOString();
    const paymentStatus: RevenuePaymentStatus = player.isPaid ? 'paid' : player.paymentStatus || 'pending';

    const payload: Partial<IRevenueRecord> = {
      sourceType: 'snooker_registration',
      relatedId: player.id,
      description: `Snooker registration (${player.fullName})`,
      amount: Number(amount || 0),
      paymentMethod: 'online',
      paymentStatus,
      updatedAt: now,
      receivedAt: paymentStatus === 'paid' ? now : undefined,
    };

    if (snapshot.empty) {
      if (paymentStatus !== 'paid') return;

      const ref = this.getRevenueCollection().doc();
      const next: IRevenueRecord = {
        id: ref.id,
        sourceType: 'snooker_registration',
        relatedId: player.id,
        description: String(payload.description),
        amount: Number(payload.amount || 0),
        paymentMethod: 'online',
        paymentStatus,
        createdAt: now,
        updatedAt: now,
        receivedAt: now,
      };
      await ref.set(next);
      return;
    }

    const doc = snapshot.docs[0];
    await doc.ref.set(payload, { merge: true });
  }

  async upsertSwimmingBookingRevenue(booking: ISwimmingBooking): Promise<void> {
    const snapshot = await this.getRevenueCollection()
      .where('sourceType', '==', 'swimming')
      .where('relatedId', '==', booking.id)
      .limit(1)
      .get();

    const now = new Date().toISOString();
    const paymentStatus: RevenuePaymentStatus = booking.paymentStatus;

    const payload: Partial<IRevenueRecord> = {
      sourceType: 'swimming',
      relatedId: booking.id,
      description: `Swimming ${booking.bookingType.replace(/_/g, ' ')} (${booking.customerName})`,
      amount: Number(booking.amount || 0),
      paymentMethod: booking.paymentMethod,
      paymentStatus,
      updatedAt: now,
      receivedAt: paymentStatus === 'paid' ? now : undefined,
    };

    if (snapshot.empty) {
      if (paymentStatus !== 'paid') return;

      const ref = this.getRevenueCollection().doc();
      const next: IRevenueRecord = {
        id: ref.id,
        sourceType: 'swimming',
        relatedId: booking.id,
        description: String(payload.description),
        amount: Number(payload.amount || 0),
        paymentMethod: (payload.paymentMethod as RevenuePaymentMethod) || 'cash',
        paymentStatus,
        createdAt: now,
        updatedAt: now,
        receivedAt: now,
      };
      await ref.set(next);
      return;
    }

    const doc = snapshot.docs[0];
    await doc.ref.set(payload, { merge: true });
  }

  async syncBookingRevenueFromBookings(): Promise<void> {
    const snapshot = await this.getBookingsCollection()
      .where('status', 'in', ['confirmed', 'checked_in', 'checked_out', 'cancelled'])
      .get();

    if (snapshot.empty) return;
    const bookings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Booking));

    for (const booking of bookings) {
      await this.upsertBookingRevenue(booking);
    }
  }

  async getOverview(): Promise<IFinancialOverview> {
    await this.syncBookingRevenueFromBookings();
    const [allRevenueRows, expenses, payroll] = await Promise.all([
      this.getAllRevenueRecords(),
      this.listExpenses(),
      this.listPayroll(),
    ]);

    const paidRevenue = allRevenueRows.filter((row) => row.paymentStatus === 'paid');

    const dailyBuckets = new Map<string, number>();
    const monthlyBuckets = new Map<string, number>();

    for (const row of paidRevenue) {
      const date = this.normalizeDate(row.receivedAt || row.createdAt);
      const amount = Number(row.amount || 0);

      const dayKey = this.toDayKey(date);
      dailyBuckets.set(dayKey, (dailyBuckets.get(dayKey) || 0) + amount);

      const monthKey = this.toMonthKey(date);
      monthlyBuckets.set(monthKey, (monthlyBuckets.get(monthKey) || 0) + amount);
    }

    const totalRevenue = paidRevenue.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const expenseTotal = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const paidPayrollTotal = payroll
      .filter((entry) => entry.status === 'paid')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalExpenses = expenseTotal + paidPayrollTotal;

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
      revenueBySource: {
        booking: paidRevenue
          .filter((row) => row.sourceType === 'booking')
          .reduce((sum, row) => sum + Number(row.amount || 0), 0),
        snooker_registration: paidRevenue
          .filter((row) => row.sourceType === 'snooker_registration')
          .reduce((sum, row) => sum + Number(row.amount || 0), 0),
        food_and_beverage: paidRevenue
          .filter((row) => row.sourceType === 'food_and_beverage')
          .reduce((sum, row) => sum + Number(row.amount || 0), 0),
        swimming: paidRevenue
          .filter((row) => row.sourceType === 'swimming')
          .reduce((sum, row) => sum + Number(row.amount || 0), 0),
        manual: paidRevenue
          .filter((row) => row.sourceType === 'manual')
          .reduce((sum, row) => sum + Number(row.amount || 0), 0),
      },
      recentRevenue: paidRevenue.slice(0, 20),
      recentExpenses: expenses.slice(0, 20),
      payroll,
    };
  }

  async exportMonthlyCsv(month: string): Promise<string> {
    const [overview, allRows] = await Promise.all([
      this.getOverview(),
      this.getAllRevenueRecords(),
    ]);

    const monthRevenue = allRows
      .filter((entry) => entry.paymentStatus === 'paid')
      .filter((entry) => (entry.receivedAt || entry.createdAt).startsWith(month))
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

    const monthExpenses = overview.recentExpenses
      .filter((expense) => (expense.incurredOn || '').startsWith(month))
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    const monthPayroll = overview.payroll
      .filter((entry) => entry.status === 'paid' && entry.month === month)
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

    const lines = [
      'month,revenue,expenses,payroll,net',
      `${month},${monthRevenue},${monthExpenses},${monthPayroll},${monthRevenue - monthExpenses - monthPayroll}`,
    ];

    return lines.join('\n');
  }
}
