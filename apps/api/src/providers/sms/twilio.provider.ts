import { SmsProvider, SendSmsOptions, SendSmsResult } from './sms.interface';
import { logger } from '@prosumate/logger';

export class TwilioSmsProvider implements SmsProvider {
  name = 'twilio';
  private accountSid: string;
  private authToken: string;
  private defaultFrom: string;

  constructor(accountSid: string, authToken: string, defaultFrom: string) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.defaultFrom = defaultFrom;
  }

  async sendSms(options: SendSmsOptions): Promise<SendSmsResult> {
    try {
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', options.to);
      params.append('From', options.from || this.defaultFrom);
      params.append('Body', options.body);

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = (await res.json()) as { sid?: string; message?: string };
      if (!res.ok) {
        throw new Error(data.message || `Twilio error: ${res.statusText}`);
      }

      logger.info(`[TWILIO SMS SENT] SID: ${data.sid} | To: ${options.to}`);
      return {
        success: true,
        messageId: data.sid || `twilio-${Date.now()}`,
        provider: 'twilio',
        status: 'sent',
      };
    } catch (err: any) {
      logger.error('Twilio SMS delivery failed', err, { to: options.to });
      return {
        success: false,
        messageId: '',
        provider: 'twilio',
        status: 'failed',
        error: err.message,
      };
    }
  }
}
