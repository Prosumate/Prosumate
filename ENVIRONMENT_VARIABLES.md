# Prosumate Internal Runtime Configuration

Prosumate defaults to self-contained providers for development and internal testing. Those providers use local application storage and deterministic rules; they do not require Resend, Twilio, Stripe, OpenAI, n8n, or Redis.

> [!IMPORTANT]
> “Internal” describes where processing and records live. It does **not** create internet email delivery, carrier SMS service, card-network settlement, or a general-purpose large language model. Email is delivered to Prosumate's local mailbox, SMS runs in a local telephony sandbox, payments settle only in an internal test ledger, and AI output comes from deterministic local rules.

## Core server

| Variable | Default | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `development` | Runtime mode: `development`, `test`, or `production`. |
| `IS_TEST_ENVIRONMENT` | `true` | Enables internal test behavior and permits the local inbound-message simulator without a secret. |
| `PORT` | `4000` | API port. |
| `HOST` | `0.0.0.0` | API bind address. |
| `API_BASE_URL` | `http://localhost:4000` | API base URL. |
| `WEB_BASE_URL` | `http://localhost:3000` | Web application base URL. |
| `ALLOW_CROSS_ORIGIN` | `http://localhost:3000` | Allowed browser origin. |
| `LOG_LEVEL` | `debug` | Structured log level. |

## Repository and in-process engine

| Variable | Default | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | empty | Reserved for the optional PostgreSQL adapter. The current API repository accessor remains in-process, so service data is lost on process restart. |
| `REDIS_URL` | empty | Ignored in internal-only mode. Cache, hashes, atomic counters, Pub/Sub, and retry jobs run in-process. |

The internal service records are stored through the repository seam rather than private provider arrays. This keeps one source of truth inside a process and allows a durable repository implementation to replace it later. It does not by itself provide restart durability or multi-process coordination.

## Authentication

| Variable | Default | Description |
| :--- | :--- | :--- |
| `JWT_SECRET` | development fallback | HMAC signing secret. Use a random value of at least 32 characters outside local development. |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Access-token lifetime. |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh-token lifetime. |
| `PASSWORD_SALT_ROUNDS` | `12` | Bcrypt work factor. |
| `INTERNAL_INBOUND_SECRET` | empty | Required by the inbound-message route when `IS_TEST_ENVIRONMENT=false`. |

## Internal providers

| Variable | Default | Description |
| :--- | :--- | :--- |
| `EMAIL_PROVIDER` | `internal` | Uses the repository-backed local mailbox, merge tags, deliverability checks, previews, and opened/clicked lifecycle receipts. |
| `INTERNAL_FROM_EMAIL` | `Prosumate <system@prosumate.local>` | Local mailbox sender identity. |
| `SMS_PROVIDER` | `internal` | Uses the repository-backed telephony sandbox, virtual test numbers, two-way threads, GSM-7/UCS-2 segmentation, and STOP/START/UNSTOP/HELP/INFO handling. |
| `INTERNAL_VIRTUAL_NUMBER` | `+1 (555) 010-2000` | Non-routable test number used inside the sandbox. |
| `PAYMENT_PROVIDER` | `internal` | Uses the internal billing sandbox with PAN checksum/expiry/CVC validation, auth/capture ledger records, subscriptions, coupons, taxes, invoices, and wallet credits. No real funds move. |
| `AI_PROVIDER` | `internal` | Uses deterministic local BANT, sentiment/intent, reply, 15-niche copy, and branch-evaluation rules. |
| `AUTOMATION_ENGINE` | `internal` | Uses the existing repository-backed workflow engine and its event triggers. |

## Optional legacy adapters

These variables are retained for backward compatibility only. They are empty in the internal configuration. Setting a provider to an external adapter explicitly opts the deployment into that third party.

| Variable | Used only when |
| :--- | :--- |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | `EMAIL_PROVIDER=resend` |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | `SMS_PROVIDER=twilio` |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Reserved; no active Stripe payment provider is selected by default. |
| `OPENAI_API_KEY` | Reserved; no active OpenAI provider is selected by default. |
| `N8N_BASE_URL`, `N8N_WEBHOOK_URL` | Reserved legacy configuration; native workflows do not use n8n. |

## Diagnostic and inspection endpoints

| Endpoint | Access | Purpose |
| :--- | :--- | :--- |
| `GET /health` | Public | Minimal process and architecture status; no tenant data. |
| `GET /ready` | Public | Active provider names and in-process repository mode. |
| `GET /api/v1/internal/services` | Platform administrator | Aggregate internal-service diagnostics; no message bodies. |
| `GET /api/v1/locations/:locationId/internal/emails` | Authenticated tenant with conversation-read permission | Location-scoped internal outbox. |
| `GET /api/v1/locations/:locationId/internal/emails/:id/preview` | Same tenant scope | Sandboxed HTML preview with a restrictive content-security policy. |
| `GET /api/v1/locations/:locationId/internal/invoices/:id/download` | Authenticated tenant with billing-read permission | Location-scoped printable sandbox invoice. |
| `GET /api/v1/locations/:locationId/internal/virtual-numbers` | Authenticated tenant with conversation-read permission | Location-scoped virtual test numbers. |

## Frontend

| Variable | Default | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Browser-accessible API URL. Never place secrets in any `NEXT_PUBLIC_*` variable. |
