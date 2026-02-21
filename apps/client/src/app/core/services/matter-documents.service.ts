import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEventType, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, Subject, forkJoin, of, map } from 'rxjs';
import { baseURL, CreateDocumentDto, IDocument, DefaultFolderType, IDocumentAccessLog, IMatter } from '@teddy-city-hotels/shared-interfaces';
import { switchMap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MatterDocumentsService {
  private http = inject(HttpClient);
  private url = baseURL + 'matters';
  private guestUrl = baseURL + 'guest';

  getDocuments(matterId: string): Observable<IDocument[]> {
    return this.http.get<IDocument[]>(`${this.url}/${matterId}/documents`);
  }

  getMatter(matterId: string): Observable<IMatter> {
    return this.http.get<IMatter>(`${this.url}/${matterId}`);
  }

  getDocumentById(matterId: string, documentId: string): Observable<{ document: IDocument, accessLogs: IDocumentAccessLog[] }> {
    return this.http.get<{ document: IDocument, accessLogs: IDocumentAccessLog[] }>(`${this.url}/${matterId}/documents/${documentId}`);
  }

  createDocumentRecord(matterId: string, dto: CreateDocumentDto): Observable<IDocument> {
    return this.http.post<IDocument>(`${this.url}/${matterId}/documents`, dto);
  }

  createBlankDocument(matterId: string, description: string, folder: string): Observable<IDocument> {
    const dto:CreateDocumentDto = { description, folder };
    return this.http.post<IDocument>(`${this.url}/${matterId}/documents/create-blank`, dto);
  }

  initiateMicrosoftUpload(matterId: string, fileName: string): Observable<{ uploadUrl: string, itemId: string, driveId: string, rootFolderId: string }> {
    return this.http.post<{ uploadUrl: string, itemId: string, driveId: string, rootFolderId: string }>(`${this.url}/${matterId}/documents/initiate-ms-upload`, { fileName });
  }

  replaceMicrosoftUpload(matterId: string, documentId: string, file: File, action: 'replaced' | 'signed' = 'replaced'): Observable<number | IDocument> {
    return this.http.post<{ uploadUrl: string }>(`${this.url}/${matterId}/documents/${documentId}/initiate-replace`, { fileName: file.name, action }).pipe(
      switchMap(session => this.uploadFileToMicrosoft(session.uploadUrl, file)),
      switchMap(event => {
        if (typeof event === 'number') {
          return of(event);
        }
        // After upload, the document is already replaced. We just need to fetch the updated record.
        // For simplicity, we can just return the document that was passed in, assuming the backend handles the audit trail.
        // A better approach would be to have the backend return the updated IDocument.
        // For now, let's just refetch all documents on the component side.
        return of(event.body as IDocument);
      })
    );
  }

  uploadFileToMicrosoft(uploadUrl: string, file: File): Observable<number | HttpResponse<any>> {

    // 1. Define the required headers for Upload Session
    const headers = new HttpHeaders({
      'Content-Range': `bytes 0-${file.size - 1}/${file.size}`,
      // It's safer to use octet-stream for the raw binary transfer
      'Content-Type': 'application/octet-stream' 
    });


    
    return this.http.put(uploadUrl, file, {
      reportProgress: true,
      observe: 'events',
      headers: headers
    }).pipe(
      map(event => (event.type === HttpEventType.UploadProgress) ? Math.round(100 * (event.loaded / (event.total || event.loaded))) : event as HttpResponse<any>)
    );
  }

  updateDocument(matterId: string, documentId: string, updates: Partial<IDocument>): Observable<IDocument> {
    return this.http.put<IDocument>(`${this.url}/${matterId}/documents/${documentId}`, updates);
  }

  deleteDocument(matterId: string, documentId: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${matterId}/documents/${documentId}`);
  }

  generateViewLink(matterId: string, documentId: string): Observable<{ webUrl: string }> {
    return this.http.get<{ webUrl: string }>(`${this.url}/${matterId}/documents/${documentId}/view-link`);
  }

  generateVersionViewLink(matterId: string, documentId: string, versionItemId: string): Observable<{ webUrl: string }> {
    return this.http.get<{ webUrl: string }>(`${this.url}/${matterId}/documents/${documentId}/versions/${versionItemId}/view-link`);
  }

  convertDocumentToPdf(matterId: string, documentId: string): Observable<{ downloadUrl: string }> {
    return this.http.post<{ downloadUrl: string }>(`${this.url}/${matterId}/documents/${documentId}/convert-to-pdf`, {});
  }

  sendEmail(matterId: string, documentIds: string[], to: string, subject: string, body: string): Observable<void> {
    return this.http.post<void>(`${this.url}/${matterId}/documents/send-email`, { documentIds, to, subject, body });
  }

  sendGuestInvite(matterId: string, documentId: string, signers: { name: string, email: string }[]): Observable<void> {
    return this.http.post<void>(`${this.guestUrl}/invite`, {
      documentId,
      matterId,
      signers
    });
  }

  updateSignedDocument(matterId: string, documentId: string, sourceItemId?: string, driveItemId?:string, fileHash?: string): Observable<IDocument> {
    return this.http.post<IDocument>(`${this.url}/${matterId}/documents/${documentId}/update-signed`, { driveItemId, sourceItemId, fileHash });
  }

  publishDocument(matterId: string, documentId: string): Observable<IDocument> {
    return this.http.post<IDocument>(`${this.url}/${matterId}/documents/${documentId}/publish`, {});
  }

  unpublishDocument(matterId: string, documentId: string): Observable<IDocument> {
    return this.http.post<IDocument>(`${this.url}/${matterId}/documents/${documentId}/unpublish`, {});
  }

  revertDocumentVersion(matterId: string, documentId: string, versionItemId: string): Observable<IDocument> {
    return this.http.post<IDocument>(`${this.url}/${matterId}/documents/${documentId}/versions/${versionItemId}/revert`, {});
  }

  downloadCertificate(matterId: string, documentId: string): Observable<Blob> {
    return this.http.get(`${this.url}/${matterId}/documents/${documentId}/certificate`, { responseType: 'blob' });
  }

  getDirectDownloadUrl(matterId: string, documentId: string): Observable<{ downloadUrl: string }> {
    return this.http.get<{ downloadUrl: string }>(`${this.url}/${matterId}/documents/${documentId}/direct-download`);
  }

  /**
   * Securely uploads a file using a signed URL and then creates the document record.
   * Emits progress percentages and finally the created IDocument.
   */
  uploadAndCreateDocument(
    matterId: string,
    file: File,
    dto: { description: string, folder: DefaultFolderType }
  ): Observable<number | IDocument> {
    const progressSubject = new Subject<number | IDocument>();

    // 1. Get the signed URL from our backend
    this.http.post<{ url: string, filePath: string }>(`${this.url}/${matterId}/documents/initiate-upload`, {
      fileName: file.name,
      contentType: file.type
    }).pipe(
      switchMap(signedUrlData => {
        // 2. Upload the file directly to Google Cloud Storage using the signed URL
        const upload$ = this.http.put(signedUrlData.url, file, {
          reportProgress: true,
          observe: 'events',
          headers: { 'Content-Type': file.type }
        });

        upload$.subscribe({
          next: event => {
            if (event.type === HttpEventType.UploadProgress) {
              const progress = Math.round(100 * (event.loaded / (event.total || event.loaded)));
              progressSubject.next(progress);
            } else if (event instanceof HttpResponse && event.status === 200) {
              // 3. Upload is complete. Now create the document record in our database.
              const finalDto: CreateDocumentDto = {
                url: signedUrlData.filePath, // We store the path, not the full URL
                description: dto.description,
                folder: dto.folder,
                filename: file.name,
                format: file.type,
              };

              this.createDocumentRecord(matterId, finalDto).subscribe({
                next: doc => {
                  progressSubject.next(doc);
                  progressSubject.complete();
                },
                error: err => progressSubject.error(err)
              });
            }
          },
          error: err => progressSubject.error(err)
        });

        return of({}); // We don't need to return anything from the switchMap itself
      }),
      catchError(err => {
        progressSubject.error(err);
        return of(null);
      })
    ).subscribe();

    return progressSubject.asObservable();
  }

}