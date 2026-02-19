
/**
import { ISalaryOverride } from './financials.interface';
 * Represents the minimal user data stored in the JWT and attached to `req.user`.
 * It's optimized for authentication and authorization checks.
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
    signatureItemId?: string; // The Microsoft Graph item ID for the user's signature image
    signatureUrl?: string; // A temporary URL for viewing the signature
    signatureRefreshToken?: string;
    signatureEmail?: string; // The email of the connected Microsoft account
    designation: string;
    department?: string; // This is the department name
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
    fcmTokens: [],
    passwordResetToken: string,
    createdAt: string;
    passwordResetTokenExpires: string;
    seenTours?: string[]; // List of tour IDs the user has seen

}

// export type UserDesignation = 'Partner' | 'Associate' | 'Secretary' | 'Accountant' | 'File Manager' | 'Librarian' | 'Receptionist';

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
