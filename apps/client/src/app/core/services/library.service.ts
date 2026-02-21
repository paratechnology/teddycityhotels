import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { CreateLibraryBookDto, IFirmUserSubset, ILibraryBook, PaginatedResponse, baseURL, IBookLogEntry } from '@teddy-city-hotels/shared-interfaces';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LibraryService {
  private http = inject(HttpClient);
  private libraryUrl = `${baseURL}library/books`;

  getBooks(filters: { page?: number; pageSize?: number; search?: string; }): Observable<PaginatedResponse<ILibraryBook>> {
    let params = new HttpParams();
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.pageSize) params = params.set('pageSize', filters.pageSize.toString());
    if (filters.search) params = params.set('search', filters.search);

    return this.http.get<PaginatedResponse<ILibraryBook>>(this.libraryUrl, { params });
  }

  createBook(dto: CreateLibraryBookDto): Observable<ILibraryBook> {
    return this.http.post<ILibraryBook>(this.libraryUrl, dto);
  }

  checkoutBook(bookId: string, user: IFirmUserSubset): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.libraryUrl}/${bookId}/checkout`, { user });
  }

  returnBook(bookId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.libraryUrl}/${bookId}/return`, {});
  }

  getBookLog(bookId: string): Observable<IBookLogEntry[]> {
    return this.http.get<IBookLogEntry[]>(`${this.libraryUrl}/${bookId}/log`);
  }

  updateBook(bookId: string, dto: Partial<CreateLibraryBookDto>): Observable<ILibraryBook> {
    return this.http.patch<ILibraryBook>(`${this.libraryUrl}/${bookId}`, dto);
  }

  deleteBook(bookId: string): Observable<void> {
    return this.http.delete<void>(`${this.libraryUrl}/${bookId}`);
  }
}