import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { baseURL, ISubscriptionPlan } from '@teddy-city-hotels/shared-interfaces';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
    private http = inject(HttpClient);
    private url = baseURL + 'subscription/';

    getPlans(): Observable<ISubscriptionPlan[]> {
        return this.http.get<ISubscriptionPlan[]>(`${this.url}plans`);
    }

    initializePayment(planId: ISubscriptionPlan['id']): Observable<{ authorization_url: string }> {
        // The backend now expects `planId` to match the document ID in the database.
        return this.http.post<{ authorization_url: string }>(`${this.url}initialize`, { planId });
    }

    verifyPayment(reference: string): Observable<any> {
        return this.http.get(`${this.url}verify/${reference}`);
    }
}
