import { IFirmUser } from './user.interface';

export interface IAuthResponse {
    success: boolean;
    message: string;
    user: IFirmUser;
    token: string;
}

