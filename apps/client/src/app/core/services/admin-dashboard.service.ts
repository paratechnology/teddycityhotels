import { Injectable, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { IAdminDashboardStats, ITasksPerUserStat, ITask } from '@teddy-city-hotels/shared-interfaces';
import { Observable, switchMap, of, map, BehaviorSubject, combineLatest, filter as rxFilter, from } from 'rxjs';
import { Firestore, collection, getDocs, query } from '@angular/fire/firestore';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private userProfile$ = toObservable(this.authService.userProfile);

  // Private subject to hold the date filter state
  private dateFilter$ = new BehaviorSubject<{ startDate?: string; endDate?: string }>({});

  // Public method for components to update the filter
  setDateFilter(params: { startDate?: string; endDate?: string }) {
    this.dateFilter$.next(params);
  }

  getTaskStats(): Observable<IAdminDashboardStats> {
    // Get the raw stream of tasks from Firestore
    const tasks$ = this.userProfile$.pipe(
      rxFilter((user): user is NonNullable<typeof user> => !!user), // Ensure we only proceed if the user is logged in
      switchMap(user => {
        if (!user || !user.firmId) {
          return of([]);
        }
        // Refactored to use a direct collection query with the modular SDK for consistency and simplicity.
        const tasksRef = collection(this.firestore, `firms/${user.firmId}/tasks`);
        const q = query(tasksRef); // We fetch all tasks for the firm and filter by date in JS.
        return from(getDocs(q)).pipe(
          map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ITask)))
        );
      })
    );

    // Combine the raw tasks stream with the date filter stream
    return combineLatest([tasks$, this.dateFilter$]).pipe(
      map(([tasks, filter]) => this.calculateStats(tasks, filter))
    );
  }

  private calculateStats(tasks: ITask[], filter: { startDate?: string; endDate?: string }): IAdminDashboardStats {
    const startDate = filter.startDate ? new Date(filter.startDate) : null;
    // Set end date to the very end of the selected day to make it inclusive.
    const endDate = filter.endDate ? new Date(filter.endDate) : null;
    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
    }

    // Apply date filter first
    const filteredTasks = tasks.filter(task => {
      const taskCreationDate = new Date(task.createdAt);
      if (startDate && taskCreationDate < startDate) return false;
      if (endDate && taskCreationDate > endDate) return false;
      return true;
    });

    const totalTasks = filteredTasks.length;
    const openTasks = filteredTasks.filter(task => task.status === 'Pending').length;
    const completedTasks = filteredTasks.filter(task => task.status === 'Completed').length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueTasks = filteredTasks.filter(task =>
      task.status === 'Pending' && task.dueDate && new Date(task.dueDate) < today
    ).length;

    const userTaskMap = new Map<string, { userName: string; openTasks: number; completedTasks: number }>();
    for (const task of filteredTasks) {
      const assignees = task.assignedTo;
      if (!assignees || !Array.isArray(assignees)) continue;

      for (const assignee of assignees) {
        if (!assignee || !assignee.id) continue;
        if (!userTaskMap.has(assignee.id)) {
          userTaskMap.set(assignee.id, { userName: assignee.fullname, openTasks: 0, completedTasks: 0 });
        }
        const userStat = userTaskMap.get(assignee.id)!;
        if (task.status === 'Pending') userStat.openTasks++;
        else if (task.status === 'Completed') userStat.completedTasks++;
      }
    }

    const tasksPerUser: ITasksPerUserStat[] = Array.from(userTaskMap.entries()).map(([userId, stats]) => ({
      userId, userName: stats.userName, openTasks: stats.openTasks, completedTasks: stats.completedTasks,
      totalTasks: stats.openTasks + stats.completedTasks,
    })).sort((a, b) => b.totalTasks - a.totalTasks);

    return { totalTasks, openTasks, completedTasks, overdueTasks, tasksPerUser };
  }
}
