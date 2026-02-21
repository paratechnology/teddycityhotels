import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { IGlobalSearchResult, baseURL } from '@teddy-city-hotels/shared-interfaces';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private http = inject(HttpClient);
  private searchUrl = `${baseURL}search`;

  search(term: string): Observable<IGlobalSearchResult> {
    const params = new HttpParams().set('q', term);
    return this.http.get<IGlobalSearchResult>(this.searchUrl, { params });
  }
}