
export interface IInvitation {
  id: string; // The invitation token itself will be the document ID
  firmId: string;
  email: string;
  designation: string;
  department?: string;
  admin?: boolean;
  isSuperAdmin?: boolean;
  roles: {
    canMatter:boolean;
    canBill: boolean;
    canSchedule: boolean;
    canAssign: boolean;
    fileManager: boolean;
    librarian: boolean;
  };
  createdAt: string; // ISO 8601 string
  status: 'pending' | 'accepted';
  invitedBy: string; // The ID of the admin who sent the invite
}