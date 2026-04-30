import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { IProperty, baseURL } from '@teddy-city-hotels/shared-interfaces';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private http = inject(HttpClient);
  private baseUrl = `${baseURL}properties`;

  list(): Observable<IProperty[]> {
    return this.http.get<IProperty[]>(this.baseUrl);
  }

  getBySlug(slug: string): Observable<IProperty> {
    return this.http.get<IProperty>(`${this.baseUrl}/slug/${slug}`);
  }

  getById(id: string): Observable<IProperty> {
    return this.http.get<IProperty>(`${this.baseUrl}/${id}`);
  }
}
