import { EmailProvider, SendEmailOptions, SendEmailResult } from './email.interface';
import { logger } from '@prosumate/logger';

export class ResendEmailProvider implements EmailProvider {
  name = 'resend';
  private apiKey: string;
  private defaultFrom: string;

  constructor(apiKey: string, defaultFrom: string = 'Prosumate <onboarding@resend.dev>') {
    this.apiKey = apiKey;
    this.defaultFrom = defaultFrom;
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    try {
      const payload = {
        from: options.from || this.defaultFrom,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html || options.text || '',
        text: options.text,
        reply_to: options.replyTo,
      };

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { id?: string; message?: string };
      if (!res.ok) {
        throw new Error(data.message || `Resend API error: ${res.statusText}`);
      }

      logger.info(`[RESEND EMAIL DELIVERED] ID: ${data.id} | To: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
      return {
        success: true,
        messageId: data.id || `resend-${Date.now()}`,
        provider: 'resend',
        status: 'sent',
      };
    } catch (err: any) {
      logger.error('Resend delivery failed', err, { to: Array.isArray(options.to) ? options.to.join(', ') : options.to });
      return {
        success: false,
        messageId: '',
        provider: 'resend',
        status: 'failed',
        error: err.message,
      };
    }
  }
}
