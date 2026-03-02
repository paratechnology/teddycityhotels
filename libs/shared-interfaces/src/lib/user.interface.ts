export type AdminModuleKey =
  | 'dashboard'
  | 'rooms'
  | 'bookings'
  | 'snooker'
  | 'financials'
  | 'notifications'
  | 'admins';

export type AdminModuleAccess = Record<AdminModuleKey, boolean>;

export const defaultAdminModuleAccess: AdminModuleAccess = {
  dashboard: false,
  rooms: false,
  bookings: false,
  snooker: false,
  financials: false,
  notifications: false,
  admins: false,
};

/**
 * Represents the minimal user data stored in the JWT and attached to `req.user`.
 * It is optimized for authentication and authorization checks.
 */
export interface IUserIndex {
  fullname: string;
  id: string;
  firmId: string;
  email: string;
  admin: boolean;
  isSuperAdmin: boolean;
  roles: {
    canBill: boolean;
    canSchedule: boolean;
    canAssign: boolean;
    fileManager: boolean;
    librarian: boolean;
  };
  adminAccess?: Partial<AdminModuleAccess>;
  department?: string;
}

/**
 * Represents the full, detailed user profile stored within a firm's database.
 */
export interface IFirmUser {
  id: string;
  firmId: string;
  firstName: string;
  lastName: string;
  otherNames?: string;
  fullname: string;
  email: string;
  phoneNumber?: string;
  picture?: string;
  signatureItemId?: string;
  signatureUrl?: string;
  signatureRefreshToken?: string;
  signatureEmail?: string;
  designation: string;
  department?: string;
  admin: boolean;
  active?: boolean;
  zid?: string;
  isSuperAdmin?: boolean;
  roles: {
    canMatter: boolean;
    canBill: boolean;
    canSchedule: boolean;
    fileManager: boolean;
    librarian: boolean;
    canAssign: boolean;
  };
  adminAccess?: Partial<AdminModuleAccess>;
  fcmTokens: string[];
  passwordResetToken: string;
  createdAt: string;
  passwordResetTokenExpires: string;
  seenTours?: string[];
}

export type IFirmUserSubset = Pick<IFirmUser, 'id' | 'fullname'>;

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
  roles?: IFirmUser['roles'];
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
