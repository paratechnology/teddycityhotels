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
