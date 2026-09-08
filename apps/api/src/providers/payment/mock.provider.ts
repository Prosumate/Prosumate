import {
  PaymentProvider,
  CreateSubscriptionParams,
  SubscriptionResult,
  TopUpWalletParams,
  WalletTopUpResult,
} from './payment.interface';
import { logger } from '@prosumate/logger';

export class MockPaymentProvider implements PaymentProvider {
  name = 'mock';

  async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult> {
    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    logger.info(`[MOCK PAYMENT] Subscribed location ${params.locationId} to plan "${params.planId}" (SIMULATED - $0 charged)`);

    return {
      id: `sub_mock_${Date.now()}`,
      locationId: params.locationId,
      planId: params.planId,
      status: 'active',
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: endDate.toISOString(),
      cancelAtPeriodEnd: false,
      paymentMethodId: params.paymentMethodId || 'pm_card_mock_visa',
      provider: 'mock',
    };
  }

  async cancelSubscription(locationId: string): Promise<SubscriptionResult> {
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14);

    logger.info(`[MOCK PAYMENT] Cancelled subscription for location ${locationId} (SIMULATED)`);

    return {
      id: `sub_mock_canceled_${Date.now()}`,
      locationId,
      planId: 'canceled',
      status: 'canceled',
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: endDate.toISOString(),
      cancelAtPeriodEnd: true,
      paymentMethodId: null,
      provider: 'mock',
    };
  }

  async topUpWallet(params: TopUpWalletParams): Promise<WalletTopUpResult> {
    const transactionId = `txn_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    logger.info(`[MOCK PAYMENT] Top-up $${(params.amountCents / 100).toFixed(2)} for location ${params.locationId} (SIMULATED - $0 charged)`);

    return {
      success: true,
      transactionId,
      newBalanceCents: params.amountCents,
      currency: 'USD',
      provider: 'mock',
    };
  }
}
