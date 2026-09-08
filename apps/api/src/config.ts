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

  // Providers configuration
  emailProvider: process.env.EMAIL_PROVIDER || 'mock',
  resendApiKey: process.env.RESEND_API_KEY,
  resendFromEmail: process.env.RESEND_FROM_EMAIL || 'Prosumate <onboarding@resend.dev>',

  smsProvider: process.env.SMS_PROVIDER || 'mock',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  twilioFromNumber: process.env.TWILIO_FROM_NUMBER,

  paymentProvider: process.env.PAYMENT_PROVIDER || 'mock',
  aiProvider: process.env.AI_PROVIDER || 'mock',

  // Automation & n8n
  n8nWebhookUrl: process.env.N8N_WEBHOOK_URL,
};
