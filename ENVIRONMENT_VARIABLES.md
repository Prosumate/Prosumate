# Prosumate Environment Variables Reference

This document provides a comprehensive guide to all environment variables supported by the Prosumate SaaS platform during the Free Test Phase and future production deployment.

---

## 1. Core Server Configuration

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | `string` | `development` | Runtime environment (`development`, `test`, `production`). |
| `IS_TEST_ENVIRONMENT` | `boolean` | `true` | When true, renders test environment indicator and enables mock provider fallbacks. |
| `PORT` | `number` | `4000` | Port on which the Fastify backend API listens. |
| `HOST` | `string` | `0.0.0.0` | Network interface binding host. |
| `API_BASE_URL` | `string` | `http://localhost:4000` | Publicly reachable base URL of the API. |
| `WEB_BASE_URL` | `string` | `http://localhost:3000` | Publicly reachable base URL of the Next.js web application. |
| `ALLOW_CROSS_ORIGIN` | `string` | `http://localhost:3000` | Allowed CORS origin for frontend requests. |
| `LOG_LEVEL` | `string` | `debug` | Winston log output level (`debug`, `info`, `warn`, `error`). |

---

## 2. Database & Persistence (Supabase / Local)

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | `string` | *Local Docker URL* | PostgreSQL connection string. For Supabase Free Tier, use the **Transaction Pooler URL** (port `6543`) with `sslmode=require`. |

> **Supabase Connection Example:**  
> `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require`  
> *Note:* The transaction pooler is automatically handled with `prepare: false` in the database client.

---

## 3. Caching & Queues (Upstash / Memory)

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `REDIS_URL` | `string` | *(Empty)* | Redis connection string (e.g. Upstash Redis free tier: `rediss://default:...@...upstash.io:6379`). When left blank, the platform automatically uses a zero-dependency in-memory cache. |

---

## 4. Authentication & Security

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `JWT_SECRET` | `string` | *(Dev secret)* | HMAC-SHA256 secret key for signing user session tokens (min 32 characters). |
| `JWT_ACCESS_EXPIRES_IN` | `string` | `15m` | Expiration window for access tokens (`15m`, `1h`). |
| `JWT_REFRESH_EXPIRES_IN` | `string` | `7d` | Expiration window for refresh tokens. |
| `PASSWORD_SALT_ROUNDS` | `number` | `12` | Bcrypt hashing rounds. |

---

## 5. Communications & Free/Test Providers

### 5.1 Email Provider
| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `EMAIL_PROVIDER` | `string` | `mock` | Active provider: `mock` (simulated, $0) or `resend` (free tier). |
| `RESEND_API_KEY` | `string` | *(Empty)* | API key from [Resend](https://resend.com) (free tier allows 3,000 emails/mo). Required if `EMAIL_PROVIDER=resend`. |
| `RESEND_FROM_EMAIL`| `string` | `Prosumate <onboarding@resend.dev>` | Verified sender address or default test domain. |

### 5.2 SMS Provider
| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `SMS_PROVIDER` | `string` | `mock` | Active provider: `mock` (simulated, $0) or `twilio` (production). In mock mode, SMS records are stored and marked `[SIMULATED]`. |
| `TWILIO_ACCOUNT_SID`| `string` | *(Empty)* | Twilio Account SID (future production use). |
| `TWILIO_AUTH_TOKEN` | `string` | *(Empty)* | Twilio Auth Token (future production use). |
| `TWILIO_FROM_NUMBER`| `string` | *(Empty)* | Twilio phone number in E.164 format. |

### 5.3 Billing & Payment Provider
| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `PAYMENT_PROVIDER` | `string` | `mock` | Active provider: `mock` ($0 charged, simulated subscriptions and wallet credits) or `stripe` (production). |
| `STRIPE_SECRET_KEY` | `string` | *(Empty)* | Stripe Secret API Key (future production use). |
| `STRIPE_WEBHOOK_SECRET`| `string` | *(Empty)* | Stripe Webhook Signing Secret. |

### 5.4 AI Assistant Provider
| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `AI_PROVIDER` | `string` | `mock` | Active provider: `mock` (deterministic structured lead qualification & copy, $0 cost) or `openai` (production). |
| `OPENAI_API_KEY` | `string` | *(Empty)* | OpenAI API Key (future production use). |

---

## 6. External Automation & n8n

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `N8N_BASE_URL` | `string` | `http://localhost:5678` | URL of self-hosted n8n instance. |
| `N8N_WEBHOOK_URL` | `string` | *(Empty)* | Webhook endpoint on n8n to receive Prosumate events. |

---

## 7. Frontend Client (`apps/web`)

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `string` | `http://localhost:4000` | Browser-accessible base URL of the backend API. **Never place private secret keys in `NEXT_PUBLIC_*` variables.** |
