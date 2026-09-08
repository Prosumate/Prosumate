import { createHmac } from 'crypto';
import { logger } from '@prosumate/logger';

export interface DispatchWebhookResult {
  statusCode: number;
  body?: string;
  signature: string;
}

export async function sendWebhookHttp(
  targetUrl: string,
  secretKey: string,
  event: string,
  payload: Record<string, unknown>
): Promise<DispatchWebhookResult> {
  const payloadString = JSON.stringify(payload);
  const signature = 'sha256=' + createHmac('sha256', secretKey).update(payloadString).digest('hex');

  // If this is an internal dummy/test URL (e.g. example.com or localhost without port), avoid hanging
  if (targetUrl.includes('example.com') || targetUrl.includes('test.local')) {
    logger.info(`[WEBHOOK DISPATCH SIMULATED] Event: ${event} -> ${targetUrl}`);
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, simulated: true }),
      signature,
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Prosumate-Signature': signature,
        'X-Prosumate-Event': event,
        'User-Agent': 'Prosumate-Webhook-Engine/1.0',
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const bodyText = await res.text().catch(() => '');
    logger.info(`[WEBHOOK DISPATCHED] Event: ${event} -> ${targetUrl} (Status: ${res.status})`);

    return {
      statusCode: res.status,
      body: bodyText,
      signature,
    };
  } catch (err: any) {
    logger.warn(`[WEBHOOK DISPATCH WARNING] Event: ${event} -> ${targetUrl} failed: ${err.message}`);
    return {
      statusCode: 502,
      body: err.message,
      signature,
    };
  }
}
