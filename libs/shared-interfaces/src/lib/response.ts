export interface SResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface IPaymentInitializationData {
  authorization_url: string;
  access_code: string;
  reference: string;
}
