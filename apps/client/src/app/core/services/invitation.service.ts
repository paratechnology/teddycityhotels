import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { IInvitation, baseURL } from '@teddy-city-hotels/shared-interfaces';
import { Observable } from 'rxjs';

export interface CreateInvitationDto {
  email: string;
  designation: any;
  department?: string;
  admin?: boolean;
  isSuperAdmin?: boolean;
  roles: {
    canMatter: boolean;
    canBill: boolean;
    canSchedule: boolean;
    canAssign: boolean;
    fileManager: boolean;
    librarian: boolean;
  };
}

export interface VerifiedInvitation {
  email: string;
  designation: any;
  firmId: string;
}

@Injectable({
  providedIn: 'root'
})
export class InvitationService {
  private http = inject(HttpClient);
  private invitationsUrl = `${baseURL}auth/invitations/`;

  create(dto: CreateInvitationDto): Observable<IInvitation> {
    return this.http.post<IInvitation>(this.invitationsUrl, dto);
  }

  verifyToken(firmId: string, token: string): Observable<VerifiedInvitation> {
    return this.http.get<VerifiedInvitation>(`${this.invitationsUrl}${firmId}/${token}`);
  }

  getPending(): Observable<IInvitation[]> {
    return this.http.get<IInvitation[]>(this.invitationsUrl);
  }

  resend(token: string): Observable<void> {
    return this.http.post<void>(`${this.invitationsUrl}${token}/resend`, {});
  }

  revoke(token: string): Observable<void> {
    return this.http.delete<void>(`${this.invitationsUrl}${token}`);
  }
}