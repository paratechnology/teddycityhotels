import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IUploadUrlResponse, baseURL } from '@teddy-city-hotels/shared-interfaces';

@Injectable({
  providedIn: 'root',
})
export class AttachmentService {
  private apiUrl = `${baseURL}attachments/upload-url`;

  constructor(private http: HttpClient) {}

  generateUploadUrl(fileName: string, contentType: string): Observable<IUploadUrlResponse> {
    return this.http.post<IUploadUrlResponse>(this.apiUrl, { fileName, contentType });
  }
}
