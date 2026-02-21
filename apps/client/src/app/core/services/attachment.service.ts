import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { IAttachment, CreateAttachmentDto, baseURL } from '@teddy-city-hotels/shared-interfaces';

interface UploadUrlResponse {
  uploadUrl: string;
  filePath: string;
}

@Injectable({
  providedIn: 'root'
})
export class AttachmentService {
  private http = inject(HttpClient);
  private attachmentsUrl = `${baseURL}attachments/`; // Assuming a base URL for attachments
  private tasksUrl = `${baseURL}tasks/`;
  public bucketName = 'pending'
  generateUploadUrl(taskId: string, fileName: string, contentType: string): Observable<UploadUrlResponse> {
    return this.http.post<UploadUrlResponse>(`${this.tasksUrl}${taskId}/attachments/generate-upload-url`, { fileName, contentType });
  }

  uploadFile(uploadUrl: string, file: File): Observable<any> {
    // We use the Fetch API for direct upload to the signed URL, wrapped in an observable
    return from(fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    }));
  }

  saveMetadata(taskId: string, file: File, filePath: string, downloadURL: string): Observable<IAttachment> {
    const dto: CreateAttachmentDto = {
      fileName: file.name,
      filePath: filePath,
      downloadURL: downloadURL,
      contentType: file.type,
      size: file.size
    };
    return this.http.post<IAttachment>(`${this.tasksUrl}${taskId}/attachments`, dto);
  }

    deleteAttachment(taskId: string, attachmentId: string): Observable<void> {
    return this.http.delete<void>(`${this.tasksUrl}${taskId}/attachments/${attachmentId}`);
  }
}