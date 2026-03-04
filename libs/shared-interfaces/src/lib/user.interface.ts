export type AdminModuleKey =
  | 'dashboard'
  | 'rooms'
  | 'bookings'
  | 'snooker'
  | 'financials'
  | 'revenue'
  | 'kitchen'
  | 'notifications'
  | 'admins';

export type AdminModuleAccess = Record<AdminModuleKey, boolean>;

export const defaultAdminModuleAccess: AdminModuleAccess = {
  dashboard: false,
  rooms: false,
  bookings: false,
  snooker: false,
  financials: false,
  revenue: false,
  kitchen: false,
  notifications: false,
  admins: false,
};

export interface IUserRoles {
  canMatter: boolean;
  canBill: boolean;
  canSchedule: boolean;
  canAssign: boolean;
  fileManager: boolean;
  librarian: boolean;
}

/**
 * Minimal user model for auth/session claims and `req.user`.
 */
export interface IUserIndex {
  fullname: string;
  id: string;
  firmId: string;
  email: string;
  admin: boolean;
  isSuperAdmin: boolean;
  roles: IUserRoles;
  adminAccess?: Partial<AdminModuleAccess>;
  department?: string;
}

/**
 * Full user profile model used by existing server/client codepaths.
 */
export interface IFirmUser extends IUserIndex {
  firstName: string;
  lastName: string;
  otherNames?: string;
  phoneNumber?: string;
  picture?: string;
  signatureItemId?: string;
  signatureUrl?: string;
  signatureRefreshToken?: string;
  signatureEmail?: string;
  designation: string;
  active?: boolean;
  isTemporaryAccount?: boolean;
  zid?: string;
  salaryOverrides?: Record<string, unknown>;
  tutorialProgress?: Record<string, unknown>;
  fcmTokens: string[];
  passwordResetToken: string;
  passwordResetTokenExpires: string;
  createdAt: string;
  lastLoginAt?: string;
  lastActiveAt?: string;
  seenTours?: string[];
  [key: string]: unknown;
}

export type IFirmUserSubset = Pick<IFirmUser, 'id' | 'fullname'> &
  Partial<Pick<IFirmUser, 'email' | 'picture' | 'department' | 'designation'>>;

export interface IRegisterFirm {
  firmName: string;
  adminFirstName: string;
  adminOtherName?: string;
  adminLastName: string;
  adminDesignation: string;
  adminEmail: string;
  adminPassword?: string;
  isSuperAdmin?: boolean;
  admin?: boolean;
  roles?: IUserRoles;
}

export interface IAdminUser {
  id: string;
  fullname: string;
  email: string;
  phoneNumber?: string;
  admin: boolean;
  isSuperAdmin: boolean;
  active: boolean;
  adminAccess: AdminModuleAccess;
  fcmTokens: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ICreateAdminUserDto {
  fullname: string;
  email: string;
  phoneNumber?: string;
  temporaryPassword: string;
  isSuperAdmin?: boolean;
  adminAccess?: Partial<AdminModuleAccess>;
}

export interface IUpdateAdminUserDto {
  fullname?: string;
  phoneNumber?: string;
  active?: boolean;
  isSuperAdmin?: boolean;
  adminAccess?: Partial<AdminModuleAccess>;
}
