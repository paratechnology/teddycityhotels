import { injectable } from 'tsyringe';
import { IRegisterFirm } from '@teddy-city-hotels/shared-interfaces';

@injectable()
export class FirmService {
  async registerFirm(profile: IRegisterFirm & { subscriptionType: 'trial' | 'paid' }): Promise<any> {
    return { success: true, message: 'Registration request received.', profile };
  }

  async initiateFirmRegistration(dto: IRegisterFirm): Promise<void> {
    return;
  }

  async resendVerification(email: string): Promise<void> {
    return;
  }
}
