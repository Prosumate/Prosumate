export interface CreateSubscriptionParams {
  locationId: string;
  planId: string;
  paymentMethodId?: string;
}

export interface SubscriptionResult {
  id: string;
  locationId: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  paymentMethodId?: string | null;
  provider: 'stripe' | 'mock';
}

export interface TopUpWalletParams {
  locationId: string;
  amountCents: number;
  paymentMethodId?: string;
}

export interface WalletTopUpResult {
  success: boolean;
  transactionId: string;
  newBalanceCents: number;
  currency: string;
  provider: 'stripe' | 'mock';
}

export interface PaymentProvider {
  name: string;
  createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult>;
  cancelSubscription(locationId: string): Promise<SubscriptionResult>;
  topUpWallet(params: TopUpWalletParams): Promise<WalletTopUpResult>;
}
