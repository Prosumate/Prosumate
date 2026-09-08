# Prosumate Internal Test Environment Guide

This guide explains how to operate the **Prosumate SaaS Platform** as a zero-cost internal test environment for 2 users for approximately 3 months, utilizing free tiers, self-hosted tools, and simulated provider adapters.

---

## 1. Architectural Overview

```
┌─────────────────────────────────────────────────────────────┐
│                 Next.js Frontend (Port 3000)                │
│    Complete GoHighLevel-style UI with Test Mode Banner      │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST + JWT Bearer
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Fastify Backend (Port 4000)                 │
│      Strict Multi-Tenant Isolation & Granular RBAC          │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
        Database Queries                 Mock / Free Providers
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│    Supabase PostgreSQL       │ │ • Email: Resend / Mock      │
│     (Free Tier, 500MB)       │ │ • SMS: Mock ([SIMULATED])   │
│                              │ │ • Billing: Mock ($0 charge) │
│       Upstash Redis          │ │ • AI: Mock (Deterministic)  │
│  (Optional Free 10k cmds/d)  │ │ • n8n: Self-Hosted Docker   │
└──────────────────────────────┘ └─────────────────────────────┘
```

---

## 2. Quickstart Prerequisites

1. **Node.js**: `v20.0.0` or higher installed.
2. **Docker Desktop** (optional): If running local PostgreSQL, Redis, or self-hosted n8n.
3. **Free Tier Accounts** (optional, for cloud test services):
   - [Supabase](https://supabase.com) (Free PostgreSQL database).
   - [Upstash](https://upstash.com) (Free Redis instance).
   - [Resend](https://resend.com) (Free transactional email, 3,000/mo).

---

## 3. Configuration Setup

1. Clone the repository and copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Configure your `.env` based on your desired test mode:

   **Option A: 100% Offline / Local Test Mode ($0, zero cloud accounts required)**
   - Keep default values in `.env`:
     ```ini
     EMAIL_PROVIDER=mock
     SMS_PROVIDER=mock
     PAYMENT_PROVIDER=mock
     AI_PROVIDER=mock
     DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/prosumate_dev
     ```
   - Start local database via Docker:
     ```bash
     docker compose up -d postgres redis
     ```

   **Option B: Cloud Free Tier Test Mode ($0, persistent anywhere)**
   - Create a project on [Supabase.com](https://supabase.com).
   - In Supabase Settings -> Database -> Connection Pooling, copy the **Transaction Pooler URL** (port `6543`) with `sslmode=require`.
     ```ini
     DATABASE_URL=postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
     ```
   - (Optional) Set up Resend free tier:
     ```ini
     EMAIL_PROVIDER=resend
     RESEND_API_KEY=re_123456789...
     ```

---

## 4. Running Database Migrations

Compile packages and run the Drizzle migration script to provision all 38 tables in your PostgreSQL database:

```bash
# Build the database workspace
npm run build:packages

# Generate/verify migration files
npm run db:generate --workspace=@prosumate/database

# Run migrations against your DATABASE_URL
npm run db:migrate --workspace=@prosumate/database
```

---

## 5. Running the Application

### Option A: Run Both Services Concurrently
```bash
npm run dev
```
- API server: `http://localhost:4000`
- Web application: `http://localhost:3000`

### Option B: Run in Separate Terminals
```bash
# Terminal 1: Backend API
npm run dev:api

# Terminal 2: Web Frontend
npm run dev:web
```

---

## 6. Running Self-Hosted n8n for External Automation

To test external automation workflows without paying for Make.com or Zapier:

1. Launch n8n with Docker:
   ```bash
   docker compose up -d n8n
   ```
2. Access n8n at `http://localhost:5678`.
3. Create a Webhook node in n8n (e.g. `POST /webhook/prosumate-lead`).
4. In Prosumate, navigate to **Dashboard -> Audit & Integrations -> Webhooks** and add your n8n URL with an HMAC secret.
5. In your `.env`, set:
   ```ini
   N8N_WEBHOOK_URL=http://localhost:5678/webhook/prosumate-lead
   ```

---

## 7. How Test Providers Work

### 7.1 Email (`EMAIL_PROVIDER=mock`)
- When a workflow or conversation triggers an email, the message is dispatched to the in-memory/database message log with status `delivered`.
- Full email payload, recipient, and subject are logged to the console with a unique `mock-email-...` ID.
- If switched to `EMAIL_PROVIDER=resend`, real emails are delivered via Resend Free API.

### 7.2 SMS (`SMS_PROVIDER=mock`)
- Real Twilio is **NOT** required.
- Messages sent in conversation threads or automated workflows are recorded with status `delivered` and a `[SIMULATED]` indicator.
- Recipients and contents appear in the conversation thread exactly as real SMS messages do.

### 7.3 Billing & Subscriptions (`PAYMENT_PROVIDER=mock`)
- Stripe live keys are **NOT** required.
- Users can test upgrading plans (Starter -> Growth -> Scale), topping up wallet credits, auto-recharge triggers, and generating invoices.
- All monetary figures and balances update persistently at $0 real cost.

### 7.4 AI Lead Qualification & Copywriting (`AI_PROVIDER=mock`)
- Paid OpenAI keys are **NOT** required.
- Returns deterministic, rich test responses for:
  - **Lead Qualification:** Score (84/100), intent classification ("High Intent"), and recommended action ("Schedule discovery consultation").
  - **Reply Suggestion:** Conversational follow-up draft.
  - **Copywriting:** Marketing email templates with dynamic tokens.

---

## 8. Seeding and Resetting Test Data

To seed the initial multi-tenant test agencies, locations, contacts, pipelines, and admin accounts:

```bash
# Populate demo test seed data
npm run db:seed --workspace=@prosumate/database
```

### Pre-configured Test Accounts:
| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Platform Superadmin** | `admin@prosumate.local` | `SuperAdmin2026!` | Full platform administration, cross-agency visibility. |
| **Agency Owner** | `sarah.owner@apex.agency` | `AgencyOwner2026!` | Owner of *Apex Growth Marketing*, Austin & Miami locations. |
| **Location User** | `alex.user@apex.agency` | `User2026!` | Standard member assigned to *Apex Austin HQ*. |

---

## 9. Running Verification Tests

Run the complete 61-test automated suite covering all 15 domains:

```bash
npm run test
```

To run a production build verification:
```bash
npm run build
```

---

## 10. Future Production Upgrade Path

When transition from beta testing to commercial production is desired:

| Service | Test Phase | Production Upgrade | Modification Required |
| :--- | :--- | :--- | :--- |
| **Database** | Supabase Free Tier | AWS RDS / Aurora Postgres | Update `DATABASE_URL` in `.env`. |
| **Redis** | In-Memory / Upstash Free | AWS ElastiCache | Set `REDIS_URL` in `.env`. |
| **Email** | Mock / Resend Free | Amazon SES / SendGrid | Implement `SesEmailProvider` / update `EMAIL_PROVIDER`. |
| **SMS** | Mock Provider | Twilio Production | Set `SMS_PROVIDER=twilio`, add Twilio SID/Token in `.env`. |
| **Payments** | Mock Provider | Stripe Live Mode | Implement `StripePaymentProvider`, set `PAYMENT_PROVIDER=stripe`. |
| **AI** | Mock Provider | OpenAI / Anthropic API | Implement `OpenAiProvider`, set `AI_PROVIDER=openai`. |

*No business logic, CRM schemas, or UI components will need to be rewritten.*
