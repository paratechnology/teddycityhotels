export interface IAcceptInvitation {
  token: string;
  firmId: string;
  password: string;
  firstName: string;
  otherNames?: string;
  lastName: string;
}