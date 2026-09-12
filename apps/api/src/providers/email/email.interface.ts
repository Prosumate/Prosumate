export interface SendEmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  locationId?: string;
  mergeData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface SendEmailResult {
  success: boolean;
  messageId: string;
  provider: 'resend' | 'mock' | 'internal';
  status: 'sent' | 'queued' | 'simulated' | 'delivered' | 'failed';
  error?: string;
  previewUrl?: string;
  deliverabilityScore?: number;
  /** Describes where a successful delivery occurred; internal never implies SMTP delivery. */
  deliveryScope?: 'internal_mailbox' | 'external' | 'simulation';
}

export interface EmailProvider {
  name: string;
  sendEmail(options: SendEmailOptions): Promise<SendEmailResult>;
}
