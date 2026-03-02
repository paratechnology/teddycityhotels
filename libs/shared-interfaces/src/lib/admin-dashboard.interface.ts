export interface ITasksPerUserStat {
  userId: string;
  userName: string;
  openTasks: number;
  completedTasks: number;
  totalTasks: number;
}

export interface IAdminDashboardStats {
  totalTasks: number;
  openTasks: number;
  completedTasks: number;
  overdueTasks: number;
  tasksPerUser: ITasksPerUserStat[];
}

export interface IHotelDashboardStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  totalBookings: number;
  activeBookings: number;
  pendingBookings: number;
  todayRevenue: number;
  monthRevenue: number;
  pendingNotifications: number;
}

export interface IRevenuePoint {
  date: string;
  amount: number;
}

export interface IFinancialExpense {
  id: string;
  category: 'utilities' | 'maintenance' | 'supplies' | 'salary' | 'other';
  description: string;
  amount: number;
  incurredOn: string;
  createdAt: string;
}

export interface IPayrollEntry {
  id: string;
  staffName: string;
  role: string;
  amount: number;
  month: string;
  status: 'pending' | 'paid';
  createdAt: string;
}

export interface IFinancialOverview {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  dailyRevenue: IRevenuePoint[];
  monthlyRevenue: IRevenuePoint[];
  recentExpenses: IFinancialExpense[];
  payroll: IPayrollEntry[];
}
