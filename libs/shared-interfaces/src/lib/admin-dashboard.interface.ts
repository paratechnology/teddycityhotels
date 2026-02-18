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

