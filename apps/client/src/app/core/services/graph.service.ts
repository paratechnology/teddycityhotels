// Create new file at: apps/client/src/app/core/services/graph.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject, from, switchMap, catchError, of, map } from 'rxjs';
import { MicrosoftAuthService } from './microsoft-auth.service';

const GRAPH_ENDPOINT = 'https://graph.microsoft.com/v1.0';

@Injectable({
  providedIn: 'root'
})
export class GraphService {
  private http = inject(HttpClient);
  private microsoftAuthService = inject(MicrosoftAuthService);

  /**
   * Creates a new blank .docx file in a specified SharePoint/OneDrive location.
   * @param fileName The name of the file to create.
   * @param driveId The ID of the Drive (can be a user's OneDrive or a SharePoint site's drive).
   * @param parentFolderId The ID of the folder to create the file in.
   * @returns An observable with the metadata of the newly created file.
   */
  createBlankDocument(fileName: string, driveId: string, parentFolderId: string): Observable<any> {
    return this.microsoftAuthService.acquireToken().pipe(
      switchMap(authResult => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${authResult.accessToken}`,
          'Content-Type': 'application/json'
        });
        
        const url = `${GRAPH_ENDPOINT}/drives/${driveId}/items/${parentFolderId}/children`;
        const body = {
          name: `${fileName}.docx`,
          file: {},
          '@microsoft.graph.conflictBehavior': 'rename'
        };

        return this.http.post(url, body, { headers });
      })
    );
  }

  /**
   * Gets a sharing link for a file that can be used for viewing or editing.
   * @param driveId The ID of the Drive where the file resides.
   * @param itemId The ID of the file item.
   * @param type The type of link to create ('view' or 'edit').
   * @returns An observable with the sharing link details.
   */
  getSharingLink(driveId: string, itemId: string, type: 'view' | 'edit'): Observable<any> {
    return this.microsoftAuthService.acquireToken().pipe(
      switchMap(authResult => {
        const headers = new HttpHeaders({ 'Authorization': `Bearer ${authResult.accessToken}` });
        const url = `${GRAPH_ENDPOINT}/drives/${driveId}/items/${itemId}/createLink`;
        const body = { type, scope: 'organization' }; // 'organization' scope is most common for internal sharing

        return this.http.post(url, body, { headers });
      })
    );
  }

  /**
   * Uploads a file to a specified SharePoint/OneDrive location using an upload session.
   * Emits progress percentages (0-1) and finally the created file metadata.
   * @param file The file to upload.
   * @param driveId The ID of the Drive.
   * @param parentFolderId The ID of the folder to upload into.
   * @returns An observable that emits progress and then the file metadata.
   */
  uploadFile(file: File, driveId: string, parentFolderId: string): Observable<number | any> {
    const progressSubject = new Subject<number | any>();

    this.microsoftAuthService.acquireToken().pipe(
      switchMap(authResult => {
        const accessToken = authResult.accessToken;
        const createSessionUrl = `${GRAPH_ENDPOINT}/drives/${driveId}/items/${parentFolderId}:/${file.name}:/createUploadSession`;

        // 1. Create an upload session
        return this.http.post<{ uploadUrl: string }>(createSessionUrl, {}, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }).pipe(
          switchMap(session => {
            // 2. Upload the file in chunks to the session URL
            const uploadUrl = session.uploadUrl;
            const maxChunkSize = 320 * 1024 * 4; // 1.25MB - Must be a multiple of 320KB
            let start = 0;

            const uploadChunk = (from: number): Observable<any> => {
              const end = Math.min(from + maxChunkSize, file.size);
              const chunk = file.slice(from, end);
              const range = `bytes ${from}-${end - 1}/${file.size}`;

              const headers = new HttpHeaders({
                'Content-Length': `${chunk.size}`,
                'Content-Range': range
              });

              return this.http.put(uploadUrl, chunk, { headers, reportProgress: true, observe: 'response' }).pipe(
                switchMap(response => {
                  progressSubject.next(end / file.size);
                  if (response.status === 201 || response.status === 200) {
                    // Final chunk was uploaded
                    progressSubject.next(response.body);
                    progressSubject.complete();
                    return of(response.body);
                  } else {
                    // More chunks to upload
                    return uploadChunk(end);
                  }
                }),
                catchError(err => {
                  progressSubject.error(err);
                  return of(null);
                })
              );
            };

            return uploadChunk(start);
          })
        );
      })
    ).subscribe();

    return progressSubject.asObservable();
  }

  /**
   * Finds a SharePoint site by its name.
   * NOTE: Creating a site programmatically is complex and requires high permissions.
   * This implementation focuses on finding an existing site.
   * @param siteName The name of the site to find (e.g., "QuickProLaw").
   */
  findOrCreateSharePointSite(siteName: string): Observable<any> {
    return this.microsoftAuthService.acquireToken().pipe(
      switchMap(authResult => {
        const headers = new HttpHeaders({ 'Authorization': `Bearer ${authResult.accessToken}` });
        // The `search` query is the most reliable way to find a site by name.
        const url = `${GRAPH_ENDPOINT}/sites?search=${siteName}`;
        
        return this.http.get<{ value: any[] }>(url, { headers }).pipe(
          map(response => {
            if (response.value && response.value.length > 0) {
              // Return the first site that matches the name.
              return response.value[0];
            }
            // In a real scenario, you might want to create the site here if not found.
            // For now, we throw an error if it's not found.
            throw new Error(`SharePoint site named "${siteName}" not found.`);
          })
        );
      })
    );
  }

  /**
   * Gets the default document library (drive) for a given SharePoint site.
   * @param siteId The ID of the SharePoint site.
   */
  getSiteDrive(siteId: string): Observable<any> {
    return this.microsoftAuthService.acquireToken().pipe(
      switchMap(authResult => {
        const headers = new HttpHeaders({ 'Authorization': `Bearer ${authResult.accessToken}` });
        // If siteId is 'me', it's a personal OneDrive. Otherwise, it's a SharePoint site.
        const url = siteId === 'me'
          ? `${GRAPH_ENDPOINT}/me/drive`
          : `${GRAPH_ENDPOINT}/sites/${siteId}/drive`;
        return this.http.get(url, { headers });
      })
    );
  }

  /**
   * Finds a folder by name within a parent, or creates it if it doesn't exist.
   * @param driveId The ID of the drive.
   * @param parentItemId The ID of the parent item (e.g., 'root').
   * @param folderName The name of the folder to find or create.
   */
  findOrCreateFolder(driveId: string, parentItemId: string, folderName: string): Observable<any> {
    return this.microsoftAuthService.acquireToken().pipe(
      switchMap(authResult => {
        const headers = new HttpHeaders({ 'Authorization': `Bearer ${authResult.accessToken}` });
        const searchUrl = `${GRAPH_ENDPOINT}/drives/${driveId}/items/${parentItemId}/children?$filter=name eq '${folderName}'`;

        return this.http.get<{ value: any[] }>(searchUrl, { headers }).pipe(
          switchMap(response => {
            if (response.value && response.value.length > 0) {
              // Folder found, return it.
              return of(response.value[0]);
            } else {
              // Folder not found, create it.
              const createUrl = `${GRAPH_ENDPOINT}/drives/${driveId}/items/${parentItemId}/children`;
              const body = { name: folderName, folder: {}, '@microsoft.graph.conflictBehavior': 'fail' };
              return this.http.post(createUrl, body, { headers });
            }
          })
        );
      })
    );
  }

  /**
   * Finds or creates a dedicated folder for a specific matter.
   * Folder name will be in the format: "Matter Title - MatterID"
   * @param driveId The firm's main drive ID.
   * @param rootFolderId The firm's root "Matters" folder ID.
   * @param matter The matter object containing at least id and title.
   */
  findOrCreateMatterFolder(driveId: string, rootFolderId: string, matter: { id: string, title: string }): Observable<any> {
    // Sanitize the matter title to be a valid folder name
    const folderName = `${matter.title.replace(/[\\/:*?"<>|]/g, '')} - ${matter.id}`;
    return this.findOrCreateFolder(driveId, rootFolderId, folderName);
  }

  /**
   * Sets up the root folder structure for a personal Microsoft Account (MSA) in their OneDrive.
   * Creates /QuickProLaw/Matters in the user's OneDrive.
   * @returns An observable that emits the driveId and the ID of the "Matters" folder.
   */
  findOrCreateOneDriveRoot(): Observable<{ driveId: string, rootFolderId: string }> {
    // For personal accounts, the drive is always '/me/drive'
    return this.getSiteDrive('me').pipe(
      switchMap(drive => {
        if (!drive) throw new Error('Could not access the user\'s OneDrive.');
        const driveId = drive.id;
        // First, ensure a "QuickProLaw" folder exists at the root.
        return this.findOrCreateFolder(driveId, 'root', 'QuickProLaw').pipe(
          switchMap(quickProLawFolder => {
            // Then, ensure a "Matters" folder exists inside the "QuickProLaw" folder.
            return this.findOrCreateFolder(driveId, quickProLawFolder.id, 'Matters').pipe(
              // Map the final result to the object shape we need.
              map(mattersFolder => ({ driveId, rootFolderId: mattersFolder.id }))
            );
          })
        );
      })
    );
  }
}
