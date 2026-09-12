import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  isTestEnvironment: process.env.IS_TEST_ENVIRONMENT !== 'false',
  port: parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || '0.0.0.0',
  jwtSecret: process.env.JWT_SECRET || 'dev-super-secret-key-prosumate-platform-32chars',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresInDays: 7,
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  logLevel: process.env.LOG_LEVEL || 'debug',
  allowCrossOrigin: process.env.ALLOW_CROSS_ORIGIN || 'http://localhost:3000',

  // Internal providers are the safe, self-contained default. Optional legacy
  // adapters remain available only when explicitly configured.
  emailProvider: process.env.EMAIL_PROVIDER || 'internal',
  internalFromEmail: process.env.INTERNAL_FROM_EMAIL || 'Prosumate <system@prosumate.local>',
  resendApiKey: process.env.RESEND_API_KEY,
  resendFromEmail: process.env.RESEND_FROM_EMAIL || 'Prosumate <system@prosumate.local>',

  smsProvider: process.env.SMS_PROVIDER || 'internal',
  internalVirtualNumber: process.env.INTERNAL_VIRTUAL_NUMBER || '+1 (555) 010-2000',
  internalInboundSecret: process.env.INTERNAL_INBOUND_SECRET,
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  twilioFromNumber: process.env.TWILIO_FROM_NUMBER,

  paymentProvider: process.env.PAYMENT_PROVIDER || 'internal',
  aiProvider: process.env.AI_PROVIDER || 'internal',

  // Native automation is the default. The existing webhook fields are kept
  // for backwards-compatible configuration parsing only.
  automationEngine: process.env.AUTOMATION_ENGINE || 'internal',
  n8nWebhookUrl: process.env.N8N_WEBHOOK_URL,
};
