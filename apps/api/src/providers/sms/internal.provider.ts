import { randomUUID } from 'crypto';
import { SmsProvider, SendSmsOptions, SendSmsResult } from './sms.interface';
import { logger } from '@prosumate/logger';
import { db } from '../../database';

export interface InternalSmsMessage {
  id: string;
  locationId?: string;
  threadId: string;
  from: string;
  to: string;
  body: string;
  direction: 'outbound' | 'inbound';
  encoding: 'GSM-7' | 'UCS-2';
  segments: number;
  status: 'queued' | 'delivered' | 'failed' | 'received';
  deliveryScope: 'internal_sandbox';
  createdAt: string;
  deliveredAt?: string;
  metadata?: Record<string, unknown>;
}

export interface InternalVirtualNumber {
  number: string;
  locationId?: string;
  active: boolean;
  createdAt: string;
}

const GSM_BASIC =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&\'()*+,-./0123456789:;<=>?¡' +
  'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';
const GSM_EXTENDED = '^{}\\[~]|€';

function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  return trimmed.startsWith('+') ? `+${digits}` : digits;
}

function isValidPhone(phone: string): boolean {
  const digits = normalizePhone(phone).replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

export class InternalSmsProvider implements SmsProvider {
  readonly name = 'internal';
  private readonly defaultFromNumber: string;
  private readonly optedOutNumbers = new Set<string>();

  constructor(defaultNumber = '+1 (555) 010-2000') {
    this.defaultFromNumber = defaultNumber;
    if (db().listInternalVirtualNumbers().length === 0) {
      for (let suffix = 2000; suffix <= 2004; suffix += 1) {
        this.provisionVirtualNumber(undefined, `+1 (555) 010-${suffix}`);
      }
    }
    if (!db().listInternalVirtualNumbers().some((entry: any) => entry.number === defaultNumber)) {
      this.provisionVirtualNumber(undefined, defaultNumber);
    }
  }

  getEncoding(text: string): 'GSM-7' | 'UCS-2' {
    for (const char of Array.from(text)) {
      if (!GSM_BASIC.includes(char) && !GSM_EXTENDED.includes(char)) return 'UCS-2';
    }
    return 'GSM-7';
  }

  calculateSegments(text: string): number {
    const encoding = this.getEncoding(text);
    if (encoding === 'UCS-2') {
      const units = Array.from(text).length;
      return units <= 70 ? 1 : Math.ceil(units / 67);
    }
    const septets = Array.from(text).reduce(
      (count, char) => count + (GSM_EXTENDED.includes(char) ? 2 : 1),
      0
    );
    return septets <= 160 ? 1 : Math.ceil(septets / 153);
  }

  private makeThreadId(first: string, second: string): string {
    return [normalizePhone(first), normalizePhone(second)].sort().join(':');
  }

  private storeOutbound(
    options: SendSmsOptions,
    body: string,
    bypassOptOut = false
  ): SendSmsResult {
    const messageId = `internal-sms-${randomUUID()}`;
    const normalizedTo = normalizePhone(options.to);
    const fromNumber = options.from || this.defaultFromNumber;

    if (!isValidPhone(normalizedTo)) {
      return {
        success: false,
        messageId,
        provider: 'internal',
        status: 'failed',
        error: `Invalid destination phone number: ${options.to}`,
        deliveryScope: 'internal_sandbox',
      };
    }
    if (!bypassOptOut && this.optedOutNumbers.has(normalizedTo)) {
      return {
        success: false,
        messageId,
        provider: 'internal',
        status: 'failed',
        error: 'Recipient has opted out of SMS messaging via STOP keyword.',
        deliveryScope: 'internal_sandbox',
      };
    }

    const encoding = this.getEncoding(body);
    const segments = this.calculateSegments(body);
    const createdAt = new Date().toISOString();
    const record: InternalSmsMessage = {
      id: messageId,
      locationId: options.locationId,
      threadId: this.makeThreadId(fromNumber, normalizedTo),
      from: fromNumber,
      to: options.to,
      body,
      direction: 'outbound',
      encoding,
      segments,
      status: 'delivered',
      deliveryScope: 'internal_sandbox',
      createdAt,
      deliveredAt: createdAt,
      metadata: options.metadata,
    };
    db().saveInternalSmsMessage(record);
    logger.info('[INTERNAL SMS] Stored outbound message in the local telephony sandbox', {
      messageId,
      segments,
      encoding,
    });

    return {
      success: true,
      messageId,
      provider: 'internal',
      status: 'delivered',
      segments,
      from: fromNumber,
      encoding,
      deliveryScope: 'internal_sandbox',
    };
  }

  async sendSms(options: SendSmsOptions): Promise<SendSmsResult> {
    return this.storeOutbound(options, options.body);
  }

  receiveInboundSms(
    from: string,
    body: string,
    toNumber = this.defaultFromNumber,
    locationId?: string
  ): { message: InternalSmsMessage; autoReply?: string } {
    if (!isValidPhone(from) || !isValidPhone(toNumber)) {
      throw new Error('Invalid inbound SMS addressing');
    }
    const normalizedFrom = normalizePhone(from);
    const keyword = body.trim().toUpperCase();
    let autoReply: string | undefined;

    if (['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'].includes(keyword)) {
      this.optedOutNumbers.add(normalizedFrom);
      autoReply = 'Prosumate: You have been opted out of text updates. Reply START to re-subscribe.';
    } else if (['START', 'UNSTOP'].includes(keyword)) {
      this.optedOutNumbers.delete(normalizedFrom);
      autoReply = 'Prosumate: You have been re-subscribed. Reply HELP for help, STOP to cancel.';
    } else if (['HELP', 'INFO'].includes(keyword)) {
      autoReply = 'Prosumate: Contact your workspace administrator for help. Reply STOP to cancel.';
    }

    const message: InternalSmsMessage = {
      id: `internal-sms-in-${randomUUID()}`,
      locationId,
      threadId: this.makeThreadId(from, toNumber),
      from,
      to: toNumber,
      body,
      direction: 'inbound',
      encoding: this.getEncoding(body),
      segments: this.calculateSegments(body),
      status: 'received',
      deliveryScope: 'internal_sandbox',
      createdAt: new Date().toISOString(),
    };
    db().saveInternalSmsMessage(message);

    // Mandatory compliance confirmations are allowed even after STOP.
    if (autoReply) {
      this.storeOutbound({ to: from, from: toNumber, body: autoReply, locationId }, autoReply, true);
    }
    return { message, autoReply };
  }

  updateDeliveryStatus(messageId: string, status: 'queued' | 'delivered' | 'failed'): boolean {
    const record = db().findInternalSmsMessageById(messageId);
    if (!record || record.direction !== 'outbound') return false;
    db().updateInternalSmsMessage(messageId, {
      status,
      deliveredAt: status === 'delivered' ? new Date().toISOString() : record.deliveredAt,
    });
    return true;
  }

  listMessages(filter?: { locationId?: string; phone?: string; direction?: 'outbound' | 'inbound' }): InternalSmsMessage[] {
    return db().listInternalSmsMessages(filter) as InternalSmsMessage[];
  }

  provisionVirtualNumber(locationId?: string, number?: string): InternalVirtualNumber {
    const candidate = number || `+1 (555) 010-${String(2000 + db().listInternalVirtualNumbers().length).padStart(4, '0')}`;
    if (db().listInternalVirtualNumbers().some((entry: any) => entry.number === candidate)) {
      return db().listInternalVirtualNumbers().find((entry: any) => entry.number === candidate) as InternalVirtualNumber;
    }
    return db().provisionInternalVirtualNumber({
      number: candidate,
      locationId,
      active: true,
      createdAt: new Date().toISOString(),
    }) as InternalVirtualNumber;
  }

  releaseVirtualNumber(number: string): boolean {
    return db().releaseInternalVirtualNumber(number);
  }

  getVirtualNumbers(locationId?: string): string[] {
    return db().listInternalVirtualNumbers(locationId).map((entry: any) => entry.number);
  }

  isOptedOut(phone: string): boolean {
    return this.optedOutNumbers.has(normalizePhone(phone));
  }
}
