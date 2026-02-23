export interface Transaction {
  id: string;
  userId: string;
  invoiceId: string;
  amount: number;
  type: 'payment' | 'refund';
  status: 'pending' | 'completed' | 'failed';
  gateway: 'stripe' | 'paypal' | 'paystack'; // Example payment gateways
  gatewayTransactionId: string;
  createdAt: string;
}
