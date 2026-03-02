export interface SResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
