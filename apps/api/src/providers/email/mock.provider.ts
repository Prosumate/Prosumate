import { EmailProvider, SendEmailOptions, SendEmailResult } from './email.interface';
import { logger } from '@prosumate/logger';

export class MockEmailProvider implements EmailProvider {
  name = 'mock';

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    const messageId = `mock-email-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    logger.info(`[MOCK EMAIL DISPATCHED] To: ${Array.isArray(options.to) ? options.to.join(', ') : options.to} | Subject: "${options.subject}"`, {
      messageId,
      to: options.to,
      subject: options.subject,
    });

    return {
      success: true,
      messageId,
      provider: 'mock',
      status: 'simulated',
    };
  }
}
