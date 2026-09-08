import { SmsProvider, SendSmsOptions, SendSmsResult } from './sms.interface';
import { logger } from '@prosumate/logger';

export class MockSmsProvider implements SmsProvider {
  name = 'mock';

  async sendSms(options: SendSmsOptions): Promise<SendSmsResult> {
    const messageId = `mock-sms-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    logger.info(`[MOCK SMS DISPATCHED] To: ${options.to} | Body: "${options.body}" [STATUS: SIMULATED]`, {
      messageId,
      to: options.to,
      body: options.body,
    });

    return {
      success: true,
      messageId,
      provider: 'mock',
      status: 'simulated',
    };
  }
}
