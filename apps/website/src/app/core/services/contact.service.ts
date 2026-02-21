import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { baseURL } from '@teddy-city-hotels/shared-interfaces';

// Define the shape of the contact form data for type safety
export interface IContactFormData {
  name: string;
  email: string;
  phone?: string;
  firmName?: string;
  inquiryType: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private http = inject(HttpClient);
  // Define the backend endpoint. Assuming a proxy is set up for '/api'.
  private contactUrl = baseURL + 'contact'; 

  sendMessage(formData: IContactFormData): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.contactUrl, formData);
  }
}
