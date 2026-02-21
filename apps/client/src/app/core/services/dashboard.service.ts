import { Injectable, signal, computed, inject, runInInjectionContext, Injector } from '@angular/core';
import { Firestore, collection, query, where, getCountFromServer, collectionGroup, getDocs, limit, orderBy } from '@angular/fire/firestore';
import { IDashboardData, ICalendarAppEvent, IFirmUser } from '@teddy-city-hotels/shared-interfaces';
import { AttendanceService } from './attendance.service';
import { firstValueFrom } from 'rxjs';

interface DashboardState {
  data: IDashboardData | null;
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private firestore = inject(Firestore);
  private attendanceService = inject(AttendanceService);
  // private injector = inject(Injector);

  private state = signal<DashboardState>({
    data: null,
    loading: false,
    error: null,
  });

  public data = computed(() => this.state().data);
  public loading = computed(() => this.state().loading);
  public error = computed(() => this.state().error);

  constructor() {}

  async loadDashboardData(user: IFirmUser): Promise<void> {
    this.state.update(s => ({ ...s, loading: true, error: null }));

    try {
      const { firmId, id: userId, fullname } = user;

      // Define base collection references
      const tasksRef = collection(this.firestore, `firms/${firmId}/tasks`);
      const mattersRef = collection(this.firestore, `firms/${firmId}/matters`);
      const eventsRef = collection(this.firestore, `firms/${firmId}/calendar`);

      // --- Define all promises for Promise.all ---

      // My pending tasks count
      const myPendingTasksPromise = getCountFromServer(query(tasksRef, where('assignedUserIds', 'array-contains', userId), where('status', '==', 'Pending')));
      
      // My overdue tasks count
      const myOverdueTasksPromise = getCountFromServer(query(tasksRef, where('assignedUserIds', 'array-contains', userId), where('status', '==', 'Pending'), where('dueDate', '<', new Date().toISOString())));

      // My upcoming events count
      const myUpcomingEventsCountPromise = getCountFromServer(query(eventsRef, where('attendees', 'array-contains', { id: userId, fullname }), where('start', '>', new Date().toISOString())));
      
      // My draft endorsements count
      const myDraftEndorsementsPromise = getCountFromServer(query(collectionGroup(this.firestore, 'endorsements'), where('firmId', '==', firmId), where('createdBy.id', '==', userId), where('status', '==', 'Draft')));
      
      // My attendance status
      const myAttendanceStatusPromise = firstValueFrom(this.attendanceService.getMyStatus());

      // Get top 5 upcoming events for the list
      const upcomingEventsPromise = getDocs(query(eventsRef, where('attendees', 'array-contains', { id: userId, fullname }), where('start', '>', new Date().toISOString()), orderBy('start', 'asc'), limit(5)));

      // --- Execute all promises in parallel ---
      const [
        myPendingTasksSnap,
        myOverdueTasksSnap,
        myUpcomingEventsCountSnap,
        myDraftEndorsementsSnap,
        myAttendanceStatus,
        upcomingEventsSnap
      ] = await Promise.all([
        myPendingTasksPromise,
        myOverdueTasksPromise,
        myUpcomingEventsCountPromise,
        myDraftEndorsementsPromise,
        myAttendanceStatusPromise,
        upcomingEventsPromise
      ]);
      
      // --- Calculate Firm Active Matters based on user role ---
      let firmActiveMattersCount = 0;
      if (user.admin) {
        const snap = await getCountFromServer(query(mattersRef, where('status', '==', 'open')));
        firmActiveMattersCount = snap.data().count;
      } else {
        const q = query(mattersRef);
        const assignedPromise = getDocs(query(q, where('assignedUserIds', 'array-contains', userId)));
        const departmentPromise = user.department ? getDocs(query(q, where('assignedDepartmentIds', 'array-contains', user.department))) : Promise.resolve(null);
        const publicPromise = getDocs(query(q, where('isPrivate', '==', false)));
        const unassignedPromise = getDocs(query(q, where('assignedUserIds', '==', []), where('assignedDepartmentIds', '==', [])));

        const [assignedSnap, departmentSnap, publicSnap, unassignedSnap] = await Promise.all([assignedPromise, departmentPromise, publicPromise, unassignedPromise]);

        const mattersMap = new Map<string, boolean>();
        assignedSnap.forEach(doc => mattersMap.set(doc.id, true));
        departmentSnap?.forEach(doc => mattersMap.set(doc.id, true));
        publicSnap.forEach(doc => mattersMap.set(doc.id, true));
        unassignedSnap.forEach(doc => mattersMap.set(doc.id, true));
        firmActiveMattersCount = mattersMap.size;
      }


      // console.log(firmActiveMattersCount);

      // Process the upcoming events into an array
      const upcomingEvents = upcomingEventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ICalendarAppEvent[];
      console.log('Upcoming Events:', upcomingEvents);

      const kpi = {
        myPendingTasks: myPendingTasksSnap.data().count,
        myOverdueTasks: myOverdueTasksSnap.data().count,
        myUpcomingEvents: myUpcomingEventsCountSnap.data().count,
        myDraftEndorsements: myDraftEndorsementsSnap.data().count,
        firmActiveMatters: firmActiveMattersCount,
      };

      // Placeholder for activity feed until it's implemented on the backend
      const activityFeed = [
        { type: 'info', text: 'You were assigned a new task: Draft Affidavit', date: new Date().toISOString(), link: '' }
      ];

      const dashboardData: IDashboardData = {
        kpi,
        upcomingEvents, // Use the new events array
        activityFeed,
        myAttendanceStatus
      };

      this.state.update(s => ({ ...s, data: dashboardData, loading: false }));
    } catch (err) {
      console.error('DashboardService Error:', err);
      this.state.update(s => ({
        ...s,
        error: 'Failed to load dashboard data.',
        loading: false
      }));
    }
  }
}