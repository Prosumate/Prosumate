import { config } from '../config';
import { EmailProvider, MockEmailProvider, ResendEmailProvider } from './email';
import { SmsProvider, MockSmsProvider, TwilioSmsProvider } from './sms';
import { PaymentProvider, MockPaymentProvider } from './payment';
import { AiProvider, MockAiProvider } from './ai';
import { logger } from '@prosumate/logger';

// 1. Email Provider Resolution
export function createEmailProvider(): EmailProvider {
  if (config.emailProvider === 'resend' && config.resendApiKey) {
    logger.info('[PROVIDER] Initialized ResendEmailProvider (Free Tier)');
    return new ResendEmailProvider(config.resendApiKey, config.resendFromEmail);
  }
  logger.info('[PROVIDER] Initialized MockEmailProvider (Free Test Mode)');
  return new MockEmailProvider();
}

// 2. SMS Provider Resolution
export function createSmsProvider(): SmsProvider {
  if (config.smsProvider === 'twilio' && config.twilioAccountSid && config.twilioAuthToken) {
    logger.info('[PROVIDER] Initialized TwilioSmsProvider');
    return new TwilioSmsProvider(config.twilioAccountSid, config.twilioAuthToken, config.twilioFromNumber || '');
  }
  logger.info('[PROVIDER] Initialized MockSmsProvider (Free Test Mode - [SIMULATED])');
  return new MockSmsProvider();
}

// 3. Payment Provider Resolution
export function createPaymentProvider(): PaymentProvider {
  logger.info('[PROVIDER] Initialized MockPaymentProvider (Free Test Mode - $0 Charged)');
  return new MockPaymentProvider();
}

// 4. AI Provider Resolution
export function createAiProvider(): AiProvider {
  logger.info('[PROVIDER] Initialized MockAiProvider (Free Test Mode - $0 API Cost)');
  return new MockAiProvider();
}

// Singleton instances for active application runtime
export const emailProvider = createEmailProvider();
export const smsProvider = createSmsProvider();
export const paymentProvider = createPaymentProvider();
export const aiProvider = createAiProvider();

export * from './email';
export * from './sms';
export * from './payment';
export * from './ai';
