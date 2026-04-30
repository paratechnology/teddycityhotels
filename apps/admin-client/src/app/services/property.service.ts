import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IProperty, IUpsertPropertyDto, baseURL } from '@teddy-city-hotels/shared-interfaces';

@Injectable({
  providedIn: 'root',
})
export class PropertyService {
  private propertiesUrl = `${baseURL}properties`;

  constructor(private http: HttpClient) {}

  listAll(): Observable<IProperty[]> {
    return this.http.get<IProperty[]>(`${this.propertiesUrl}/admin/list`);
  }

  get(id: string): Observable<IProperty> {
    return this.http.get<IProperty>(`${this.propertiesUrl}/${id}`);
  }

  create(dto: IUpsertPropertyDto): Observable<IProperty> {
    return this.http.post<IProperty>(this.propertiesUrl, dto);
  }

  update(id: string, dto: IUpsertPropertyDto): Observable<IProperty> {
    return this.http.put<IProperty>(`${this.propertiesUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.propertiesUrl}/${id}`);
  }
}
