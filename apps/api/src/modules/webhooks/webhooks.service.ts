import { createHmac } from 'crypto';
import { logger } from '@prosumate/logger';

export interface DispatchWebhookResult {
  statusCode: number;
  body?: string;
  signature: string;
  deliveryScope: 'internal_log';
}

export async function sendWebhookHttp(
  targetUrl: string,
  secretKey: string,
  event: string,
  payload: Record<string, unknown>
): Promise<DispatchWebhookResult> {
  const payloadString = JSON.stringify(payload);
  const signature = 'sha256=' + createHmac('sha256', secretKey).update(payloadString).digest('hex');
  // Internal-only mode intentionally performs no network request. The signed
  // envelope is retained in the repository audit log by the caller and can be
  // inspected or replayed after an explicit external integration is added.
  logger.info('[INTERNAL WEBHOOK] Recorded signed callback envelope without network delivery', {
    event,
    targetLabel: targetUrl,
  });
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, recorded: true, deliveredExternally: false }),
    signature,
    deliveryScope: 'internal_log',
  };
}
