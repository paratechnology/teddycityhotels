import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { baseURL } from '@quickprolaw/shared-interfaces';
import { Observable } from 'rxjs';

export interface VerifiedInvitation {
  email: string;
  designation: string;
  firmId: string;
}

@Injectable({
  providedIn: 'root'
})
export class InvitationService {
  private http = inject(HttpClient);
  private invitationsUrl = `${baseURL}auth/invitations/`; // Note: Adjusted URL based on typical REST patterns

  verifyToken(firmId: string, token: string): Observable<VerifiedInvitation> {
    console.log('Firm ID:', firmId);
    console.log('Token:', token);

    return this.http.get<VerifiedInvitation>(`${this.invitationsUrl}verify/${firmId}/${token}`);
  }
}
