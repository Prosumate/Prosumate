export interface SendSmsOptions {
  to: string;
  from?: string;
  body: string;
  mediaUrl?: string[];
  metadata?: Record<string, unknown>;
}

export interface SendSmsResult {
  success: boolean;
  messageId: string;
  provider: 'twilio' | 'mock';
  status: 'sent' | 'queued' | 'simulated' | 'failed';
  error?: string;
}

export interface SmsProvider {
  name: string;
  sendSms(options: SendSmsOptions): Promise<SendSmsResult>;
}
