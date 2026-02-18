import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { baseURL, ISubscriptionPlan } from '@quickprolaw/shared-interfaces';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
    private http = inject(HttpClient);
    private url = baseURL + 'subscription/';

    getPlans(): Observable<ISubscriptionPlan[]> {
        return this.http.get<ISubscriptionPlan[]>(`${this.url}plans`);
    }

}
