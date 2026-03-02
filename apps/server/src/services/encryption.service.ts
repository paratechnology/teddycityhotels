import { injectable } from 'tsyringe';

@injectable()
export class EncryptionService {
  encrypt(value: string): string {
    return value;
  }

  decrypt(value: string): string {
    return value;
  }
}
