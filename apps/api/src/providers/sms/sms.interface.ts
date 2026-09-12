export interface SendSmsOptions {
  to: string;
  from?: string;
  body: string;
  locationId?: string;
  mediaUrl?: string[];
  metadata?: Record<string, unknown>;
}

export interface SendSmsResult {
  success: boolean;
  messageId: string;
  provider: 'twilio' | 'mock' | 'internal';
  status: 'sent' | 'queued' | 'simulated' | 'delivered' | 'failed';
  error?: string;
  segments?: number;
  from?: string;
  encoding?: 'GSM-7' | 'UCS-2';
  /** Internal mode records messages locally and never implies carrier delivery. */
  deliveryScope?: 'internal_sandbox' | 'carrier' | 'simulation';
}

export interface SmsProvider {
  name: string;
  sendSms(options: SendSmsOptions): Promise<SendSmsResult>;
}
