import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ITask, TaskStatus, baseURL, IComment, IFirmUser, ITaskTemplate } from '@quickprolaw/shared-interfaces';
import { tap, Observable, catchError, of, throwError, map } from 'rxjs';
import { ToastController } from '@ionic/angular/standalone';
import { AuthService } from './auth.service';
import { Firestore, collection, doc,  query, where, orderBy, onSnapshot, QueryConstraint } from '@angular/fire/firestore';
export type TaskFilter = 'myTasks' | 'delegated' | 'all';

interface TasksState {
  myTasks: ITask[];
  delegatedTasks: ITask[];
  allFirmTasks: ITask[]; // For admins
  templates: ITaskTemplate[];
  loading: boolean;
  error: string | null;
}




@Injectable({
  providedIn: 'root'
})

export class TaskService {
  private http = inject(HttpClient);
  private toastController = inject(ToastController);
  // --- Dependencies for Real-Time Firestore Access ---
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  private tasksUrl = `${baseURL}tasks/`;


    private state = signal<TasksState>({
    myTasks: [],
    delegatedTasks: [],
    allFirmTasks: [],
    templates: [],
    loading: false,
    error: null,
  });


  
  getTasks(filter: TaskFilter, user: IFirmUser): Observable<ITask[]> {
    if (!user) return of([]);

    const tasksCollection = collection(this.firestore, `firms/${user.firmId}/tasks`);
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
    
    switch (filter) {
      case 'myTasks':
        // Use 'array-contains' to query the new assignedUserIds array.
        constraints.push(where('assignedUserIds', 'array-contains', user.id));
        break;
      case 'delegated': {
        // 'createdBy.id' is the Firebase Auth UID. We must get this from the auth service.
        const authUser = this.authService.firebaseUser();
        if (authUser) {
          constraints.push(where('createdBy.id', '==', authUser.uid));
        }
        break;
      }
      case 'all':
        // No additional filter needed for 'all'
        break;
    }

    const q = query(tasksCollection, ...constraints);

    return new Observable<ITask[]>(subscriber => {
      const unsubscribe = onSnapshot(q,
        (querySnapshot) => {
          const tasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ITask));

          subscriber.next(tasks);
        },
        (error) => subscriber.error(error)
      );
      return () => unsubscribe();
    });
  }

  /**
   * Gets all tasks for a specific matter in real-time.
   */
  getTasksForMatter(matterId: string): Observable<ITask[]> {
    const user = this.authService.userProfile();
    if (!user) return of([]);

    const tasksCollection = collection(this.firestore, `firms/${user.firmId}/tasks`);
    const q = query(tasksCollection, where('matter.id', '==', matterId));

    return new Observable<ITask[]>(subscriber => {
      const unsubscribe = onSnapshot(q,
        (querySnapshot) => {
          const tasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ITask));
          subscriber.next(tasks);
        },
        (error) => subscriber.error(error)
      );
      return () => unsubscribe();
    });
  }

  /**
   * Creates a new task and optimistically updates the local state.
   */
  createTask(taskData: Partial<ITask>): Observable<ITask | null> {
    return this.http.post<ITask>(this.tasksUrl, taskData).pipe(
      tap(() => {
        this.presentToast('Task created successfully.', 'success');
      }),
      catchError(err => {
        this.presentToast('Failed to create task.', 'danger');
        throw err;
      })
    );
  }

  /**
   * Updates an existing task and the local state.
   */
  updateTask(taskId: string, updates: Partial<ITask>): Observable<ITask | null> {
    return this.http.patch<ITask>(`${this.tasksUrl}${taskId}`, updates).pipe(
      tap(() => {
        this.presentToast('Task updated.', 'success');
      }),
      catchError(err => {
        this.presentToast('Failed to update task.', 'danger');
        throw err;
      })
    );
  }

  /**
   * Deletes a task from the backend and removes it from the local state.
   */
  deleteTask(taskId: string): Observable<{ success: boolean }> {
    return this.http.delete(`${this.tasksUrl}${taskId}`).pipe(
      tap(() => {
        this.presentToast('Task deleted.', 'medium');
      }),
      map(() => ({ success: true })), // transform successful response to an object
      catchError(err => {
        this.presentToast('Failed to delete task.', 'danger');
        throw err;
      })
    );
  }
  
  /**
   * Updates the status of a single task. Uses PATCH for partial update.
   */
  updateTaskStatus(taskId: string, status: TaskStatus): Observable<ITask> {
    const user = this.authService.userProfile();
    if (!user) {
      return throwError(() => new Error('User not authenticated'));
    }

    const payload: Partial<ITask> = { status };

 
    return this.http.patch<ITask>(`${this.tasksUrl}${taskId}`, payload).pipe(
      tap(() => {
        const message = status === 'Completed' ? 'Task marked as complete' : 'Task status updated';
        this.presentToast(message, 'success');
      }),
      catchError(err => {
        this.presentToast('Failed to update task.', 'danger');
        throw err;
      })
    );
  }



    updateTaskStage(taskId: string, stageId: string, completed: boolean): Observable<ITask> {
      const url = `${this.tasksUrl}${taskId}/stages/${stageId}`;
      return this.http.patch<ITask>(url, { isComplete: completed }).pipe(
        tap(updatedTask => {
          // Instantly update the local state for a snappy UI response
          this.state.update(s => {
              const updateArray = (arr: ITask[]) => arr.map(t => t.id === taskId ? updatedTask : t);
              return {
                  ...s,
                  myTasks: updateArray(s.myTasks),
                  delegatedTasks: updateArray(s.delegatedTasks),
                  allFirmTasks: updateArray(s.allFirmTasks),
              };
          });
        })
      );
    }
  


    

  private async presentToast(message: string, color: 'success' | 'danger' | 'medium') {
    const toast = await this.toastController.create({ message, duration: 3000, color, position: 'top' });
    toast.present();
  }


  // --- REAL-TIME METHODS (Direct Firestore Access) ---

  /**
   * Gets a single task by its ID in real-time from Firestore.
   * This bypasses our Express API for lower latency and live updates.
   */
  getTaskById(id: string): Observable<ITask> {
  const user = this.authService.userProfile();
  if (!user) {
    return throwError(() => new Error('User not authenticated'));
  }
  const taskDocRef = doc(this.firestore, `firms/${user.firmId}/tasks/${id}`);

  return new Observable<ITask>(subscriber => {
    const unsubscribe = onSnapshot(taskDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const task = { id: docSnap.id, ...docSnap.data() } as ITask;
          subscriber.next(task);
        } else {
          subscriber.error(new Error('Task not found'));
        }
      },
      (error) => {
        subscriber.error(error);
      }
    );

    // Return the unsubscribe function to be called when the observable is unsubscribed
    return () => unsubscribe();
  });
}





  getTasksForUser(id: string): Observable<ITask[]> {
  const user = this.authService.userProfile();
  if (!user) {
    return throwError(() => new Error('User not authenticated'));
  }
  const taskDocRef = doc(this.firestore, `firms/${user.firmId}/tasks/${id}`);

  return new Observable<ITask[]>(subscriber => {
    const unsubscribe = onSnapshot(taskDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const task = { id: docSnap.id, ...docSnap.data() } as ITask;
          subscriber.next([task]);
        } else {
          subscriber.next([]);
        }
      },
      (error) => {
        subscriber.error(error);
      }
    );

    // Return the unsubscribe function to be called when the observable is unsubscribed
    return () => unsubscribe();
  });
}





  /**
   * Gets all comments for a task in real-time.
   */
  getCommentsForTask(taskId: string): Observable<IComment[]> {
    const user = this.authService.userProfile();
    if (!user) return of([]);

    const commentsPath = `firms/${user.firmId}/tasks/${taskId}/comments`;
    const commentsCollectionRef = collection(this.firestore, commentsPath);
    const q = query(commentsCollectionRef, orderBy('createdAt', 'asc'));

    return new Observable<IComment[]>(subscriber => {
      const unsubscribe = onSnapshot(q,
        (querySnapshot) => {
          const comments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IComment));
          subscriber.next(comments);
        },
        (error) => {
          subscriber.error(error);
        }
      );
      return () => unsubscribe();
    });
  }

  /**
   * Posts a new comment to a task via the backend API.
   */
  addComment(taskId: string, content: string): Observable<IComment> {
    return this.http.post<IComment>(`${this.tasksUrl}${taskId}/comments`, { content }).pipe(
      tap(() => this.presentToast('Comment added.', 'medium')),
      catchError(err => {
        this.presentToast('Failed to add comment.', 'danger');
        throw err;
      })
    );
  }

  /**
   * Updates a comment via the backend API.
   */
  updateComment(taskId: string, commentId: string, content: string): Observable<IComment> {
    return this.http.patch<IComment>(`${this.tasksUrl}${taskId}/comments/${commentId}`, { content }).pipe(
      tap(() => this.presentToast('Comment updated.', 'medium')),
      catchError(err => {
        this.presentToast('Failed to update comment.', 'danger');
        throw err;
      })
    );
  }

  /**
   * Deletes a comment via the backend API.
   */
  deleteComment(taskId: string, commentId: string): Observable<void> {
    return this.http.delete<void>(`${this.tasksUrl}${taskId}/comments/${commentId}`).pipe(
      tap(() => this.presentToast('Comment deleted.', 'success')),
      catchError(err => {
        this.presentToast('Failed to delete comment.', 'danger');
        throw err;
      })
    );
  }






}