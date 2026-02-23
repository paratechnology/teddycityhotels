import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Attachment } from '@teddy-city-hotels/shared-interfaces';

const baseURL = 'http://localhost:8080/api';

@Injectable({
  providedIn: 'root'
})
export class AttachmentService {

  private apiUrl = `${baseURL}/attachments`;

  constructor(private http: HttpClient) { }

  upload(file: File): Observable<Attachment> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Attachment>(this.apiUrl, formData);
  }
}
