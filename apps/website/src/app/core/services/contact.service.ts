import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { baseURL, IContactInquiry, ICreateContactInquiryDto } from '@teddy-city-hotels/shared-interfaces';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private http = inject(HttpClient);
  private contactUrl = `${baseURL}contact`;

  sendMessage(formData: ICreateContactInquiryDto): Observable<IContactInquiry> {
    return this.http.post<IContactInquiry>(this.contactUrl, formData);
  }
}
