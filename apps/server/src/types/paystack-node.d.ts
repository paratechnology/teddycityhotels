declare module 'paystack-node' {
  class Paystack {
    constructor(secretKey: string);
    transaction: {
      initialize(payload: any): Promise<{ data: any }>;
      verify(payload: any): Promise<{ data: any }>;
    };
  }

  export default Paystack;
}
