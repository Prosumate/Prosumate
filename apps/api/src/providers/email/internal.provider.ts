import { randomUUID } from 'crypto';
import { EmailProvider, SendEmailOptions, SendEmailResult } from './email.interface';
import { logger } from '@prosumate/logger';
import { db } from '../../database';

export type InternalEmailStatus = 'queued' | 'delivered' | 'opened' | 'clicked' | 'failed';

export interface InternalEmailRecord {
  id: string;
  locationId?: string;
  direction: 'outbound' | 'inbound';
  mailbox: 'outbox' | 'inbox';
  to: string[];
  from: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  metadata?: Record<string, unknown>;
  status: InternalEmailStatus;
  deliveryScope: 'internal_mailbox';
  deliverabilityScore: number;
  createdAt: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
}

function getMergeValue(source: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    if (!value || typeof value !== 'object') return undefined;
    return (value as Record<string, unknown>)[key];
  }, source);
}

function interpolate(template: string, values: Record<string, unknown>): string {
  return template.replace(/{{\s*([a-zA-Z0-9_.]+)\s*}}/g, (match, path: string) => {
    const value = getMergeValue(values, path);
    return value === undefined || value === null ? match : String(value);
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export class InternalEmailProvider implements EmailProvider {
  readonly name = 'internal';
  private readonly defaultFrom: string;

  constructor(defaultFrom = 'Prosumate Internal Mailer <system@prosumate.local>') {
    this.defaultFrom = defaultFrom;
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    const recipients = (Array.isArray(options.to) ? options.to : [options.to])
      .map((recipient) => recipient.trim());
    const messageId = `internal-mail-${randomUUID()}`;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!recipients.length || recipients.some((email) => !emailRegex.test(email))) {
      logger.warn('[INTERNAL EMAIL] Rejected invalid recipient syntax', { messageId });
      return {
        success: false,
        messageId,
        provider: 'internal',
        status: 'failed',
        error: 'Invalid recipient email format',
        deliverabilityScore: 0,
        deliveryScope: 'internal_mailbox',
      };
    }

    const mergeData = options.mergeData || {};
    const subject = interpolate(options.subject || '', mergeData);
    const rawText = options.text || (options.html ? options.html.replace(/<[^>]*>?/g, '') : '');
    const text = interpolate(rawText, mergeData);
    const html = interpolate(options.html || `<p>${escapeHtml(text).replace(/\n/g, '<br/>')}</p>`, mergeData);

    let score = 100;
    if (!subject.trim()) score -= 40;
    if (subject.length > 5 && subject.toUpperCase() === subject) score -= 25;
    if (/\b(free|buy now|urgent|winner|guaranteed)\b|\$\$\$/i.test(`${subject} ${text}`)) score -= 15;
    if (!text.trim()) score -= 20;

    const createdAt = new Date().toISOString();
    const baseRecord: InternalEmailRecord = {
      id: messageId,
      locationId: options.locationId,
      direction: 'outbound',
      mailbox: 'outbox',
      to: recipients,
      from: options.from || this.defaultFrom,
      replyTo: options.replyTo,
      subject,
      html,
      text,
      metadata: options.metadata,
      status: 'queued',
      deliveryScope: 'internal_mailbox',
      deliverabilityScore: Math.max(0, score),
      createdAt,
    };
    db().saveInternalEmail(baseRecord);

    // Delivery here means placement in Prosumate's internal mailbox only. No
    // SMTP/API or claim of delivery to an external recipient is made.
    const deliveredAt = new Date().toISOString();
    db().updateInternalEmail(messageId, { status: 'delivered', deliveredAt });
    recipients.forEach((recipient) => {
      db().saveInternalEmail({
        ...baseRecord,
        id: `${messageId}:inbox:${recipient.toLowerCase()}`,
        direction: 'inbound',
        mailbox: 'inbox',
        status: 'delivered',
        deliveredAt,
        metadata: { ...(options.metadata || {}), sourceMessageId: messageId, internalRecipient: recipient },
      });
    });

    logger.info('[INTERNAL EMAIL] Stored message in the local outbox and shadow inbox', {
      messageId,
      recipientCount: recipients.length,
      deliverabilityScore: Math.max(0, score),
    });

    return {
      success: true,
      messageId,
      provider: 'internal',
      status: 'delivered',
      previewUrl: options.locationId
        ? `/api/v1/locations/${options.locationId}/internal/emails/${messageId}/preview`
        : undefined,
      deliverabilityScore: Math.max(0, score),
      deliveryScope: 'internal_mailbox',
    };
  }

  receiveInboundEmail(options: {
    from: string;
    to: string | string[];
    subject?: string;
    text?: string;
    html?: string;
    locationId?: string;
    metadata?: Record<string, unknown>;
  }): InternalEmailRecord {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const text = options.text || (options.html ? options.html.replace(/<[^>]*>?/g, '') : '');
    const record: InternalEmailRecord = {
      id: `internal-mail-in-${randomUUID()}`,
      locationId: options.locationId,
      direction: 'inbound',
      mailbox: 'inbox',
      to: recipients,
      from: options.from,
      subject: options.subject || '',
      text,
      html: options.html || `<p>${escapeHtml(text).replace(/\n/g, '<br/>')}</p>`,
      metadata: options.metadata,
      status: 'delivered',
      deliveryScope: 'internal_mailbox',
      deliverabilityScore: 100,
      createdAt: new Date().toISOString(),
      deliveredAt: new Date().toISOString(),
    };
    return db().saveInternalEmail(record) as InternalEmailRecord;
  }

  getOutbox(filter?: { locationId?: string; recipient?: string; status?: string }): InternalEmailRecord[] {
    return db().listInternalEmails({ ...filter, direction: 'outbound' }) as InternalEmailRecord[];
  }

  getInbox(filter?: { locationId?: string; recipient?: string; status?: string }): InternalEmailRecord[] {
    return db().listInternalEmails({ ...filter, direction: 'inbound' }) as InternalEmailRecord[];
  }

  getEmailById(messageId: string): InternalEmailRecord | undefined {
    return (db().findInternalEmailById(messageId) || undefined) as InternalEmailRecord | undefined;
  }

  markOpened(messageId: string): boolean {
    const email = this.getEmailById(messageId);
    if (!email || !['delivered', 'opened'].includes(email.status)) return false;
    db().updateInternalEmail(messageId, { status: 'opened', openedAt: new Date().toISOString() });
    return true;
  }

  markClicked(messageId: string): boolean {
    const email = this.getEmailById(messageId);
    if (!email || !['delivered', 'opened', 'clicked'].includes(email.status)) return false;
    const now = new Date().toISOString();
    db().updateInternalEmail(messageId, {
      status: 'clicked',
      openedAt: email.openedAt || now,
      clickedAt: now,
    });
    return true;
  }

  clear(): void {
    db().clearInternalEmails();
  }
}
