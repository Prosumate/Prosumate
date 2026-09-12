import { config } from '../config';
import { EmailProvider, MockEmailProvider, ResendEmailProvider, InternalEmailProvider } from './email';
import { SmsProvider, MockSmsProvider, TwilioSmsProvider, InternalSmsProvider } from './sms';
import { PaymentProvider, MockPaymentProvider, InternalPaymentProvider } from './payment';
import { AiProvider, MockAiProvider, InternalAiProvider } from './ai';
import { logger } from '@prosumate/logger';

// 1. Email Provider Resolution
export function createEmailProvider(): EmailProvider {
  if (config.emailProvider === 'resend') {
    if (config.resendApiKey) {
      logger.info('[PROVIDER] Initialized optional ResendEmailProvider');
      return new ResendEmailProvider(config.resendApiKey, config.resendFromEmail);
    }
    logger.warn('[PROVIDER] EMAIL_PROVIDER=resend has no key; using internal mailbox instead');
  }
  if (config.emailProvider === 'mock') {
    logger.info('[PROVIDER] Initialized MockEmailProvider (Free Test Mode)');
    return new MockEmailProvider();
  }
  if (!['internal', 'resend', 'mock'].includes(config.emailProvider)) {
    logger.warn(`[PROVIDER] Unknown email provider '${config.emailProvider}'; using internal mailbox`);
  }
  logger.info('[PROVIDER] Initialized InternalEmailProvider (local mailbox; no SMTP transport)');
  return new InternalEmailProvider(config.internalFromEmail);
}

// 2. SMS Provider Resolution
export function createSmsProvider(): SmsProvider {
  if (config.smsProvider === 'twilio') {
    if (config.twilioAccountSid && config.twilioAuthToken) {
      logger.info('[PROVIDER] Initialized optional TwilioSmsProvider');
      return new TwilioSmsProvider(config.twilioAccountSid, config.twilioAuthToken, config.twilioFromNumber || '');
    }
    logger.warn('[PROVIDER] SMS_PROVIDER=twilio is missing credentials; using internal SMS sandbox instead');
  }
  if (config.smsProvider === 'mock') {
    logger.info('[PROVIDER] Initialized MockSmsProvider (Free Test Mode - [SIMULATED])');
    return new MockSmsProvider();
  }
  if (!['internal', 'twilio', 'mock'].includes(config.smsProvider)) {
    logger.warn(`[PROVIDER] Unknown SMS provider '${config.smsProvider}'; using internal SMS sandbox`);
  }
  logger.info('[PROVIDER] Initialized InternalSmsProvider (local sandbox; no carrier transport)');
  return new InternalSmsProvider(config.internalVirtualNumber);
}

// 3. Payment Provider Resolution
export function createPaymentProvider(): PaymentProvider {
  if (config.paymentProvider === 'mock') {
    logger.info('[PROVIDER] Initialized MockPaymentProvider (Free Test Mode - $0 Charged)');
    return new MockPaymentProvider();
  }
  if (config.paymentProvider !== 'internal') {
    logger.warn(`[PROVIDER] Unsupported payment provider '${config.paymentProvider}'; using internal billing sandbox`);
  }
  logger.info('[PROVIDER] Initialized InternalPaymentProvider (ledger sandbox; no external funds movement)');
  return new InternalPaymentProvider();
}

// 4. AI Provider Resolution
export function createAiProvider(): AiProvider {
  if (config.aiProvider === 'mock') {
    logger.info('[PROVIDER] Initialized MockAiProvider (Free Test Mode - $0 API Cost)');
    return new MockAiProvider();
  }
  if (config.aiProvider !== 'internal') {
    logger.warn(`[PROVIDER] Unsupported AI provider '${config.aiProvider}'; using deterministic local rules`);
  }
  logger.info('[PROVIDER] Initialized InternalAiProvider (deterministic local rules engine)');
  return new InternalAiProvider();
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
