# PROSUMATE FREE TEST PHASE AUDIT REPORT
**Document Reference:** `PROSUMATE_FREE_TEST_PHASE_AUDIT.md`  
**Role:** Senior Technical Architect & Lead Engineer  
**Scope:** Complete Codebase Audit, Current State Mapping & Free Test Environment Transition Plan  
**Target Operational Profile:** 2 internal beta testers, ~3 months continuous testing, $0 mandatory SaaS/cloud infrastructure cost.  
**Strict Directives:** DO NOT rebuild from scratch, DO NOT remove existing features, DO NOT redesign the product, DO NOT delete modules, DO NOT replace UI with placeholders.

---

## 1. Current Architecture

### 1.1 Monorepo Structure & Tooling
The Prosumate codebase is structured as a TypeScript monorepo using npm workspaces (`workspaces: ["packages/*", "apps/*"]`), with Node.js >= 20.0.0.

- **`apps/api` (Backend):**
  - Framework: Fastify v5 (`@fastify/cors`, `@fastify/rate-limit`, `@fastify/sensible`).
  - Runtime: Node.js with TypeScript (`tsc -b`).
  - Architecture: Modular Fastify plugins/controllers registering versioned REST endpoints under `/api/v1/...`.
  - Security & Authentication: Custom PreHandler guards (`authGuard`, `tenantGuard`, `permissionGuard`) enforcing JWT bearer token validation, multi-tenant isolation, and granular role/permission checks.
  - Logging: Winston-backed structured JSON logging via `@prosumate/logger`.
  - Test Suite: Native Node.js test runner (`node --test dist/test/*.spec.js`), running 14 comprehensive test suites (55 integration/unit tests).

- **`apps/web` (Frontend):**
  - Framework: Next.js 14 (App Router) with React 18 and Tailwind CSS.
  - State & Navigation: Server/client components under `src/app/dashboard/...`, `src/app/f/[slug]` (public landing pages/forms), and `src/app/login` / `src/app/register`.
  - API Client: Centralized singleton `ApiClient` (`apps/web/src/lib/api.ts`) managing localStorage JWT tokens, tenant state (`prosumate_active_agency`, `prosumate_active_location`), and typed REST communication.
  - UI Design: Modern dark/slate SaaS theme with Lucide icons, responsive sidebar navigation, interactive modal drawers, and data-dense dashboards.

- **`packages/types`:**
  - Core domain interfaces, enums, and models: Users, Agencies, Locations, Memberships, Permissions (`AgencyRole`, `LocationRole`, `Permission`), CRM Entities (Contacts, Companies, Pipelines, Opportunities), Calendars, Appointments, Workflows, Billing, AI, Webhooks, and Audit Logs.

- **`packages/validation`:**
  - Zod schemas validating incoming request payloads across all modules (auth, contacts, opportunities, appointments, forms, workflows, billing, AI, webhooks, and enterprise SSO).

- **`packages/logger`:**
  - Winston structured logger providing leveled logging (`debug`, `info`, `warn`, `error`) with request ID correlation.

- **`packages/database`:**
  - Drizzle ORM (`drizzle-orm` v0.39, `postgres` v3.4, `drizzle-kit` v0.30).
  - PostgreSQL schema definitions (`src/schema/*`) for primary identity, tenancy, and CRM tables.
  - Monolithic In-Memory Repository (`MemoryDatabase` in `src/repository.ts`), which currently powers the running API and test suites.
  - Deterministic Seed Script (`src/seed.ts`) populating multi-tenant demo data upon application startup.

### 1.2 System Interaction Diagram
```
┌────────────────────────────────────────────────────────────┐
│                    Next.js Frontend (apps/web)             │
│   Dashboard UI, Pipelines, Workflow Builder, Forms, Admin  │
└──────────────────────────────┬─────────────────────────────┘
                               │ HTTP REST (fetch) + JWT Bearer
                               ▼
┌────────────────────────────────────────────────────────────┐
│                   Fastify API (apps/api)                   │
│   Guards: authGuard ➔ tenantGuard ➔ permissionGuard        │
│   Modules: Auth, CRM, Workflows, Forms, Calendars, etc.    │
└──────────────┬──────────────────────────────┬──────────────┘
               │                              │
     (Current Persistence)          (Current Integrations)
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌───────────────────────────┐
│   MemoryDatabase Repository  │ │ Completely Simulated /    │
│  In-Memory JavaScript Maps   │ │ Synchronous In-Memory     │
│ (Lost on process restart)    │ │ Mocks (SMS, Stripe, AI)   │
└──────────────────────────────┘ └───────────────────────────┘
```

---

## 2. Existing Features / Modules

The Prosumate application has already been engineered with an extensive GoHighLevel-style feature set. Every module has active routes, validation schemas, frontend views, and corresponding backend handlers:

| Module / Feature | Backend Controller | Frontend Route / View | Capabilities |
| :--- | :--- | :--- | :--- |
| **Authentication & IAM** | `auth.controller.ts`, `auth.service.ts` | `/login`, `/register` | User registration, bcrypt password hashing, JWT access & refresh tokens, token refresh, revocation, session storage. |
| **Multi-Tenancy** | `agencies.controller.ts`, `locations.controller.ts` | `/dashboard/locations` | Agency hierarchy, sub-account (location) provisioning, agency/location switcher, strict tenant isolation. |
| **RBAC & Permissions** | `tenant.guard.ts`, `permission.guard.ts` | `/dashboard/team` | AgencyRole (`OWNER`, `ADMIN`, `MEMBER`), LocationRole (`LOCATION_ADMIN`, `USER`, `READ_ONLY`), granular permission matrices, permission overrides. |
| **CRM Contacts & Companies** | `contacts.controller.ts`, `companies.controller.ts` | `/dashboard/contacts` | Contact management, duplicate prevention (email/phone), tags, custom fields, notes, tasks, activity audit timeline. |
| **Pipelines & Deals** | `pipelines.controller.ts` | `/dashboard/pipelines` | Kanban pipeline view, deal stages, drag-and-drop stage movement, monetary value tracking, opportunity timeline events. |
| **Conversations** | `conversations.controller.ts` | `/dashboard/conversations` | Multi-channel inbox (Email & SMS threads), outbound message dispatch, inbound webhook simulator. |
| **Calendars & Booking** | `calendars.controller.ts` | `/dashboard/calendars` | Calendar provisioning, recurring weekly availability slots, appointment booking, conflict detection, reschedule/cancel. |
| **Forms & Lead Capture** | `forms.controller.ts` | `/dashboard/forms`, `/f/[slug]` | Visual form builder schema, public embedded form submission, automatic contact creation/update, event triggering. |
| **Workflow Engine** | `workflows.controller.ts` | `/dashboard/workflows` | Automation triggers (`FORM_SUBMITTED`, `CONTACT_CREATED`, `STAGE_MOVED`), sequential steps (`SEND_EMAIL`, `SEND_SMS`, `ADD_TAG`, `REMOVE_TAG`, `CREATE_TASK`, `MOVE_STAGE`, `WAIT_DELAY`), execution logs. |
| **Funnels & Landing Pages** | `funnels.controller.ts` | `/dashboard/funnels` | Sales funnel steps, block-based landing page renderer, pageview and conversion metric tracking. |
| **Reputation & Reviews** | `reputation.controller.ts` | `/dashboard/reputation` | Review collection, review request dispatch via SMS/Email, public rating widget, response management. |
| **AI Assistant** | `ai.controller.ts` | `/dashboard/ai` | Location AI persona configuration, tone adjustment, lead qualification scoring, reply suggestion, marketing copy generation. |
| **Marketplace & Snapshots** | `marketplace.controller.ts` | `/dashboard/marketplace` | 1-click industry snapshots, cloning pipeline stages, default tags, and starter workflows into locations. |
| **Billing & SaaS Controls** | `billing.controller.ts` | `/dashboard/billing` | Tiered subscription plans (`starter`, `growth`, `scale`), wallet credit top-up, usage metered billing (telephony/AI/emails), invoices. |
| **Webhooks & SSO** | `webhooks.controller.ts`, `enterprise.controller.ts` | `/dashboard/audit` | Outbound webhook registry, HMAC-SHA256 signature generation, SAML/OIDC enterprise configuration. |
| **Audit Logs & Reporting** | `audit.controller.ts`, `reporting.controller.ts` | `/dashboard/audit`, `/dashboard/reporting` | Audit trail with CSV/JSON export, multi-channel attribution (ROAS, CAC, conversion rate), sales rep leaderboard. |

---

## 3. Current Database Implementation

### 3.1 Dual-Layer Paradox
The codebase contains a dual database architecture:
1. **Drizzle ORM Schema Layer (`packages/database/src/schema/`):**
   - Contains clean, professional PostgreSQL table definitions utilizing `drizzle-orm/pg-core` with foreign keys, indexes, and cascades.
   - However, it **only covers a subset of entities**: `users`, `sessions`, `agencies`, `locations`, `memberships`, `audit_logs`, `companies`, `contacts`, `contact_notes`, `contact_tasks`, `pipelines`, `pipeline_stages`, `opportunities`, `opportunity_movements`, and `activity_events`.
   - The connection client factory `createDatabaseClient` in `packages/database/src/client.ts` is implemented using `postgres` (postgres.js) and `drizzle-orm/postgres-js`, but **is currently idle and not wired to the running API**.

2. **In-Memory Store (`packages/database/src/repository.ts` - `MemoryDatabase`):**
   - The entire running API (`apps/api`) currently interacts with `memoryDb`, a singleton instance of `MemoryDatabase`.
   - `MemoryDatabase` holds 32 in-memory `Map<string, T>` and array collections.
   - **Crucial Problem:** Every time the API server restarts, all data created by users or automated workflows is instantly wiped and reset to the demo seed in `seed.ts`. There is currently **zero persistent storage**.

### 3.2 Entities Present in `MemoryDatabase` vs Missing in Drizzle Schema
To migrate to persistent Supabase PostgreSQL without deleting features, the following 10 entity groups currently living *only* in `MemoryDatabase` must be formally mapped to Drizzle ORM schemas:
1. `calendars` & `appointments`
2. `forms` & `form_submissions`
3. `conversations` & `messages`
4. `workflows` & `workflow_executions`
5. `subscription_plans`, `location_subscriptions`, `credit_wallets`, `usage_transactions`, `invoices`
6. `funnels` & `campaign_metrics`
7. `customer_reviews` & `review_requests`
8. `ai_configs` & `ai_generations`
9. `snapshots`
10. `webhooks`, `webhook_logs`, and `sso_configs`

---

## 4. Current External Integrations

The codebase has touchpoints designed for 8 major external cloud services:
1. **Relational Database:** PostgreSQL (Postgres connection string via `DATABASE_URL`).
2. **Caching & Queues:** Redis (referenced in architecture specs for BullMQ/queues).
3. **Email Delivery:** Transactional email provider (SendGrid/Resend concepts).
4. **SMS & Telephony:** Twilio (phone numbers, SMS dispatch).
5. **Billing & Subscriptions:** Stripe (customers, payment methods, subscriptions, usage records).
6. **Artificial Intelligence:** OpenAI / LLM API (prompt completion, lead evaluation).
7. **Calendar Synchronization:** Google Calendar OAuth 2.0.
8. **Automation & Webhooks:** External webhooks / webhook receivers.

---

## 5. Which Integrations are Real

Currently in the codebase:
- **JWT & Password Security:** REAL. Uses real `bcryptjs` for password hashing and real `jsonwebtoken` with HMAC-SHA256 signatures and expiration verification.
- **Outbound Webhook Signature Generation:** REAL. Uses Node's native `crypto.createHmac('sha256', secretKey)` to generate genuine HMAC signatures.
- **Structured Logging:** REAL. Uses real Winston writing structured JSON streams.
- **REST API & HTTP Transport:** REAL. Complete Fastify v5 HTTP server listening on configured ports with CORS and payload parsing.
- **Drizzle ORM Engine:** REAL. Real Drizzle ORM dependencies and queries compiled for PostgreSQL.

---

## 6. Which Integrations are Simulated

Currently, all external cloud integrations are simulated inside `packages/database/src/repository.ts`:
- **Database Persistence:** SIMULATED in Node.js heap memory (`Map`).
- **Email Delivery:** SIMULATED. Outbound email creates an in-memory message object with status `'delivered'` without invoking an SMTP or HTTP email API.
- **SMS Delivery:** SIMULATED. Outbound SMS creates an in-memory message object with status `'delivered'` without communicating with Twilio.
- **Stripe Payments & Subscriptions:** SIMULATED. Plans, subscriptions, and wallet credit top-ups are simulated in memory using synthetic IDs (e.g., `'sub_simulated_...'`, `'pm_test_...'`).
- **AI Processing:** SIMULATED. AI text generation uses heuristic template matching and deterministic mock responses based on the request task type (`lead_qualification`, `reply_suggestion`, `copywriting`).
- **Calendar Synchronization:** SIMULATED. Availability slot calculation and appointment scheduling occur against in-memory calendar rules without Google Calendar sync.
- **Outbound Webhook Network Dispatch:** SIMULATED. `dispatchWebhook` creates a fake delivery log with `responseStatus: 200` without performing an actual HTTP `fetch` or `axios` call.

---

## 7. Which Features Depend on Paid Services in Production

In a standard production environment, the platform would incur substantial monthly subscription and usage bills:

| Feature / Capability | Production Paid Service | Estimated Production Cost | Proposed $0 Free/Test Strategy |
| :--- | :--- | :--- | :--- |
| Primary Database | AWS RDS / Aurora PostgreSQL | $30 - $150+/mo | **Supabase Free Tier** (500MB PostgreSQL, SSL, pooling). |
| Background Queues / Cache | AWS ElastiCache Redis | $18 - $60+/mo | **Upstash Redis Free Tier** (10,000 commands/day). |
| Transactional Email | SendGrid / AWS SES / Postmark | $15 - $35+/mo | **Resend Free Tier** (3,000 emails/mo, 100/day) + Mock Provider fallback. |
| Two-Way SMS | Twilio ($0.0079/SMS + $1.15/mo/number) | $20 - $100+/mo | **MockSmsProvider** (stores in DB with `[TEST/SIMULATED]` status; UI functions identically). |
| Billing & Subscriptions | Stripe Production | Transaction fees + setup | **MockPaymentProvider** (simulated checkout, invoices, credit top-ups; $0 money moved). |
| AI Assistant & Qualification | OpenAI API (GPT-4o / Claude 3.5) | $20 - $100+/mo usage | **MockAiProvider** (deterministic structured responses) + optional free tier (e.g. Gemini 1.5 Flash Free / Groq Free). |
| Complex Automation Workflows | Temporal Cloud / Make.com / Zapier | $25 - $100+/mo | **Self-Hosted n8n Community Edition** (free Docker container) + native internal workflow engine. |
| Object Storage (Attachments) | AWS S3 / Cloudflare R2 | $5 - $20+/mo | **Local Disk / Supabase Free Storage** (1GB free). |
| Error Monitoring | Sentry Team Tier | $26/mo | **Structured Logger Diagnostics** (`@prosumate/logger`) with console/file output. |

---

## 8. Files That Will Need Modification

To implement the free test phase without breaking existing functionality, the following files and directories will be created or modified:

### 8.1 Database & Persistence Layer (`packages/database`)
- `packages/database/src/schema/`
  - `calendars.ts` **[NEW]**: Schema for calendars and appointments.
  - `forms.ts` **[NEW]**: Schema for forms and form submissions.
  - `conversations.ts` **[NEW]**: Schema for conversations and messages.
  - `workflows.ts` **[NEW]**: Schema for workflows and workflow execution history.
  - `billing.ts` **[NEW]**: Schema for plans, subscriptions, wallets, transactions, invoices.
  - `funnels.ts` **[NEW]**: Schema for funnels and campaign metrics.
  - `reputation.ts` **[NEW]**: Schema for reviews and review requests.
  - `ai.ts` **[NEW]**: Schema for AI configuration and generation history.
  - `webhooks.ts` **[NEW]**: Schema for webhooks, webhook delivery logs, SSO configs.
  - `snapshots.ts` **[NEW]**: Schema for marketplace industry snapshot templates.
  - `schema/index.ts` **[MODIFY]**: Re-export all schema definitions.
- `packages/database/src/client.ts` **[MODIFY]**: Enhance connection pooling with Supabase transaction pooler support (`prepare: false`), SSL enforcement, and health check validation.
- `packages/database/src/repository.ts` **[MODIFY / ADAPT]**: Implement unified repository interface (`IDatabaseRepository`) allowing seamless transition between PostgreSQL/Drizzle and in-memory test harness, ensuring all 55 existing tests continue passing without regression.
- `packages/database/src/seed.ts` **[MODIFY]**: Make seed script idempotent (check if users/locations exist before inserting) and support writing directly to Supabase PostgreSQL.

### 8.2 Backend Core & Integrations (`apps/api`)
- `apps/api/src/config.ts` **[MODIFY]**: Add environment variables for `DATABASE_URL`, `REDIS_URL`, `EMAIL_PROVIDER`, `RESEND_API_KEY`, `SMS_PROVIDER`, `PAYMENT_PROVIDER`, `AI_PROVIDER`, `N8N_WEBHOOK_URL`, `IS_TEST_ENVIRONMENT`.
- `apps/api/src/main.ts` **[MODIFY]**: Initialize database connection on boot, test connectivity, and run database migration/seed conditionally.
- `apps/api/src/providers/` **[NEW DIRECTORY]**:
  - `email/email.interface.ts`: Standard `EmailProvider` interface.
  - `email/resend.provider.ts`: Resend HTTP API implementation (Free Tier).
  - `email/mock.provider.ts`: Deterministic mock email provider logging to console & DB.
  - `sms/sms.interface.ts`: `SmsProvider` interface.
  - `sms/mock.provider.ts`: Simulated SMS provider logging messages to DB with `SIMULATED` badge.
  - `sms/twilio.provider.ts`: Staged Twilio adapter for future production activation.
  - `payment/payment.interface.ts`: `PaymentProvider` interface.
  - `payment/mock.provider.ts`: Simulated checkout and subscription management.
  - `ai/ai.interface.ts`: `AiProvider` interface.
  - `ai/mock.provider.ts`: Deterministic lead scoring and copy generation.
  - `ai/gemini-free.provider.ts`: Optional free AI tier integration.
- `apps/api/src/modules/webhooks/webhooks.service.ts` **[NEW]**: Real HTTP webhook dispatcher using `fetch` with HMAC-SHA256 headers, retry logic, and n8n webhook compatibility.
- `apps/api/src/modules/conversations/conversations.controller.ts` **[MODIFY]**: Connect to `EmailProvider` and `SmsProvider`.
- `apps/api/src/modules/billing/billing.controller.ts` **[MODIFY]**: Delegate payment actions to `PaymentProvider`.
- `apps/api/src/modules/ai/ai.controller.ts` **[MODIFY]**: Delegate AI text generation to `AiProvider`.
- `apps/api/src/modules/workflows/workflows.controller.ts` **[MODIFY]**: Support dispatching events to n8n webhook endpoints.

### 8.3 Frontend & Environment (`apps/web`, Root)
- `apps/web/src/components/TestModeBadge.tsx` **[NEW]**: Unobtrusive top banner indicating: `INTERNAL TEST MODE (Simulated SMS / Payments / Mock AI)`.
- `apps/web/src/app/dashboard/layout.tsx` **[MODIFY]**: Include `TestModeBadge`.
- `.env.example` **[MODIFY]**: Document all test provider variables and configuration keys.
- `docker-compose.yml` **[MODIFY]**: Add an optional self-hosted n8n service container configuration.

---

## 9. Proposed Supabase Migration

### 9.1 Database Architecture & Connection
- **Service:** Supabase Free Tier PostgreSQL (v15/16).
- **Connection Strategy:**
  - Standard pooling string: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres` (Transaction Mode, port 6543, `prepare: false` in postgres.js).
  - Direct connection string for migrations (`drizzle-kit`): `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`.
  - SSL mode: `ssl=require`.

### 9.2 Migration Strategy (Preserve & Extend)
1. **Preserve Existing Structure:** The existing tables (`users`, `agencies`, `locations`, `memberships`, `contacts`, `companies`, `pipelines`, etc.) in `packages/database/src/schema/` are already well-designed. We preserve every column name, type, foreign key, and index.
2. **Add Missing Drizzle Schemas:** Create schema files for the 10 missing domain groups.
3. **Generate SQL Migrations:** Use `drizzle-kit generate` to produce deterministic SQL migration files in `packages/database/drizzle`.
4. **Execute Migration:** Run `drizzle-kit migrate` against the Supabase database.
5. **Multi-Tenant Security:** Every table retains its `agency_id` and `location_id` foreign keys, indexed for tenant-scoped querying.
6. **Zero Edge Functions:** All business logic stays in NestJS/Fastify backend. Supabase acts strictly as a persistent managed PostgreSQL instance.

---

## 10. Proposed Upstash Integration

### 10.1 Free Tier Boundaries
- **Limit:** Upstash Redis Free Tier allows 10,000 commands/day and 256MB storage, which is more than 50x what 2 beta testers will consume over 3 months (~100-300 commands/day).

### 10.2 Targeted Use Cases (Minimal & Modular)
Redis will NOT be injected into simple CRUD operations. It will be used strictly where ephemeral shared state or rate-limiting is beneficial:
1. **Public Form & Endpoint Rate Limiting:** Prevent abuse on public endpoints (`/api/v1/forms/:formId/submit`, `/f/[slug]`) using `@upstash/redis` or `@fastify/rate-limit`.
2. **Session / Revocation Cache:** Fast token blacklist lookup on logout (`jwt:revoked:<jti>`).
3. **Workflow Event Queue Buffering:** Buffer inbound webhook bursts before sequential processing.

---

## 11. Proposed n8n Integration

### 11.1 Architecture & Separation of Concerns
Prosumate’s internal workflow engine (which triggers on form submits, stage movements, tag changes) **remains completely intact and operational**.
n8n is integrated as an **external automation bridge**:

```
┌────────────────────────────────────────────────────────────┐
│                    PROSUMATE CORE                          │
│  Lead Capture ➔ Workflow Trigger ➔ Internal Actions        │
└──────────────┬──────────────────────────────▲──────────────┘
               │                              │
               │ HTTP Outbound Webhook        │ HTTP REST API (JWT)
               │ (HMAC-SHA256 signed)         │ (Create contact/task)
               ▼                              │
┌─────────────────────────────────────────────┴──────────────┐
│             SELF-HOSTED n8n COMMUNITY EDITION              │
│  - Webhook Trigger                                         │
│  - External Enrichment / Multi-App Integrations            │
│  - Slack / Discord / Google Sheets notification            │
└────────────────────────────────────────────────────────────┘
```

### 11.2 Integration Touchpoints
1. **Outbound from Prosumate:** When an event occurs (e.g., `lead.created`, `form.submitted`, `opportunity.stage_changed`), Prosumate’s Webhook Service dispatches an HTTP POST to n8n's webhook URL with payload and HMAC signature.
2. **Inbound to Prosumate:** n8n uses Prosumate’s REST API (`/api/v1/...`) with a dedicated API key / service JWT to update contacts, add tags, create tasks, or move opportunity stages.
3. **Sample Test Scenarios:**
   - *Test Scenario A:* Form Submission ➔ Prosumate creates contact ➔ Webhook fires to n8n ➔ n8n formats notification to Slack/Discord webhook.
   - *Test Scenario B:* External Webhook into n8n ➔ n8n cleanses data ➔ n8n calls Prosumate API to create an Opportunity.

---

## 12. Proposed Free / Test Provider Architecture

To satisfy the **Critical Architectural Rule**:
```
REAL PROVIDER ➔ PROVIDER INTERFACE ➔ TEST / MOCK PROVIDER
```

All external communications will adhere to clean TypeScript interfaces:

### 12.1 Email (`EmailProvider`)
- Interface: `sendEmail(options: SendEmailOptions): Promise<SendEmailResult>`
- Implementations:
  - `MockEmailProvider`: Logs email contents to database `messages` and server log; returns `messageId: "mock-email-..."`.
  - `ResendEmailProvider`: Transmits via Resend Free API (up to 3,000 emails/month free).
- Config: `EMAIL_PROVIDER=resend` or `EMAIL_PROVIDER=mock`.

### 12.2 SMS (`SmsProvider`)
- Interface: `sendSms(options: SendSmsOptions): Promise<SendSmsResult>`
- Implementations:
  - `MockSmsProvider`: Records SMS to `messages` table with status `SIMULATED`, logs to terminal, triggers any inbound reply simulation if needed.
  - `TwilioSmsProvider`: Plugged in later with zero changes to CRM business logic.
- Config: `SMS_PROVIDER=mock`.

### 12.3 Payments & Billing (`PaymentProvider`)
- Interface: `createCustomer`, `createSubscription`, `cancelSubscription`, `topUpWallet`, `recordUsage`.
- Implementations:
  - `MockPaymentProvider`: Generates valid simulated customer IDs, invoices, and payment receipts without Stripe account dependencies.
  - `StripePaymentProvider`: Reserved for commercial launch.
- Config: `PAYMENT_PROVIDER=mock`.

### 12.4 AI Assistant (`AiProvider`)
- Interface: `generateCompletion`, `qualifyLead`, `suggestReply`, `draftCopy`.
- Implementations:
  - `MockAiProvider`: Deterministic responses based on keyword heuristics and prompt structure (e.g. Lead Score 85, "High Intent Commercial Prospect").
  - `GeminiFreeAiProvider` / `GroqFreeAiProvider`: Optional free tier adapters.
- Config: `AI_PROVIDER=mock`.

### 12.5 Calendar & Booking (`CalendarProvider`)
- Interface: `getAvailableSlots`, `bookAppointment`, `cancelAppointment`.
- Implementation: Native internal rule engine using stored availability intervals. No Google Calendar OAuth required.
- Config: `CALENDAR_PROVIDER=local`.

---

## 13. Risks of Changing the Current System

| Identified Risk | Severity | Mitigation Strategy |
| :--- | :--- | :--- |
| **Breaking Existing In-Memory Test Suite** | High | Design the repository layer such that `MemoryDatabase` remains intact or implements the same `IDatabaseRepository` interface. Ensure all 55 tests pass in test mode. |
| **Data Loss During API Restarts** | Critical | Moving to Supabase PostgreSQL permanently eliminates this risk; all user activity will persist. |
| **Connection Pooling Exhaustion on Supabase Free Tier** | Medium | Use Supabase Transaction Pooler (port 6543) with `max: 10` connections in `postgres.js`. Only 2 testers will generate < 2 concurrent connections. |
| **Upstash Daily Quota Exhaustion** | Low | Confine Redis usage to rate limiting and session revocation; fallback gracefully to in-memory cache if Redis is unavailable. |
| **Webhook Timeouts / External Latency** | Medium | Execute outbound webhooks asynchronously in the background with a 5-second timeout and try/catch error logging so main API requests never hang. |
| **Secret Leaks in Client Bundles** | High | Audit all environment variables. Strictly prohibit provider keys in `NEXT_PUBLIC_*` variables. |

---

## 14. Features That Must NOT Be Touched

The following critical core components must **NOT** be removed, redesigned, or simplified:
1. **Multi-Tenant Hierarchy & Tenant Isolation:** `Agency`, `Location`, `UserAgencyMembership`, `UserLocationMembership`, and `tenantGuard.ts`.
2. **RBAC & Granular Permissions:** `AgencyRole`, `LocationRole`, `permission.guard.ts`, and permission checking on all controllers.
3. **CRM Data Models & Relationships:** Contacts, Companies, Tags, Custom Fields, Notes, Tasks, and Activity Timelines.
4. **Pipelines & Opportunity Kanban:** Stage ordering, deal values, and stage movement audit logs.
5. **Visual Workflow Engine:** Sequential step execution (`ADD_TAG`, `SEND_EMAIL`, `SEND_SMS`, `CREATE_TASK`, `MOVE_OPPORTUNITY_STAGE`, `WAIT_DELAY`) and execution logging.
6. **Public Form & Funnel Renderers:** Public routes `/f/[slug]`, embedded lead capture forms, and conversion tracking.
7. **Conversations Multi-Channel Inbox UI:** Unified threads for Email and SMS.
8. **Reputation & Review System:** Star rating calculations, reviews, review requests, and public widgets.
9. **Marketplace & Snapshot Deployment:** 1-click template cloning into locations.
10. **Audit Log System & CSV/JSON Export:** Security event trail and compliance logging.

---

## 15. Step-by-Step Implementation Plan

Upon receiving approval, execution will follow this structured, 17-step sequence:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PHASE-BY-PHASE ROADMAP                          │
├────────────────────────────────────────────────────────────────────────┤
│ Phase A: Schema & Persistence Foundation (Steps 1 - 5)                 │
│ Phase B: Provider Abstraction & Free/Mock Adapters (Steps 6 - 9)       │
│ Phase C: Automation, Webhooks & n8n Bridge (Steps 10 - 11)             │
│ Phase D: Verification, Seed Data & Regression Testing (Steps 12 - 15)  │
│ Phase E: Test Environment Documentation & Handover (Steps 16 - 17)     │
└────────────────────────────────────────────────────────────────────────┘
```

- **Step 1: Complete Schema Coverage**
  - Author Drizzle ORM schema definitions for all 10 remaining domain models in `packages/database/src/schema/`.
  - Validate foreign keys, indexes, and type definitions against `@prosumate/types`.

- **Step 2: Generate Drizzle Migrations**
  - Configure `drizzle.config.ts`.
  - Run `drizzle-kit generate` to generate clean SQL migration scripts.

- **Step 3: Supabase PostgreSQL Connection Setup**
  - Update `packages/database/src/client.ts` to support Supabase SSL connection pooling (`ssl=require`, `prepare: false`).
  - Add connection health check and retry mechanism.

- **Step 4: Dual-Engine Repository Architecture**
  - Refactor repository architecture with an `IDatabaseRepository` interface.
  - Implement `DrizzleRepository` implementing all queries against PostgreSQL, while preserving `MemoryDatabase` for isolated lightning-fast unit tests.

- **Step 5: Wiring API to Persistent Database**
  - Update `apps/api/src/main.ts` and controllers to use the persistent repository when `DATABASE_URL` is configured.
  - Migrate seed routine to populate Supabase PostgreSQL idempotently.

- **Step 6: Email Provider Abstraction & Resend Integration**
  - Implement `EmailProvider` interface.
  - Create `ResendEmailProvider` and `MockEmailProvider`.
  - Wire into `conversations.controller.ts` and workflow engine `SEND_EMAIL` action.

- **Step 7: SMS Provider Abstraction & Mock Provider**
  - Implement `SmsProvider` interface and `MockSmsProvider`.
  - Mark outbound messages as `[SIMULATED]` in database and UI while keeping conversation threads fully functional.

- **Step 8: Billing & Payment Provider Abstraction**
  - Implement `PaymentProvider` interface and `MockPaymentProvider`.
  - Wire into `billing.controller.ts` to allow 2 beta testers to test upgrading plans, topping up wallet credits, and reviewing invoices without Stripe fees.

- **Step 9: AI Provider Abstraction & Mock Provider**
  - Implement `AiProvider` interface and `MockAiProvider`.
  - Wire into `ai.controller.ts` and workflow actions to provide deterministic lead scoring and reply generation.

- **Step 10: Real Outbound Webhooks & n8n Bridge**
  - Upgrade `webhooks.controller.ts` to dispatch genuine asynchronous HTTP requests with HMAC signatures.
  - Add retry and timeout handling.

- **Step 11: n8n Docker Setup & Sample Automation Flows**
  - Add an optional self-hosted n8n container definition to `docker-compose.yml`.
  - Document pre-built test webhooks (New Lead notification, Opportunity Follow-up).

- **Step 12: Upstash Redis Integration**
  - Implement lightweight Redis client helper for rate-limiting and session revocation if `REDIS_URL` is provided, with memory fallback.

- **Step 13: Test Mode UI Badge**
  - Add an unobtrusive `TestModeBadge` in `apps/web/src/app/dashboard/layout.tsx` to clearly distinguish simulated actions.

- **Step 14: Automated Test Suite & Regression Verification**
  - Run full test suite (`node --test dist/test/*.spec.js`) to verify 100% pass rate (55/55 tests).
  - Add test coverage for mock providers and webhook delivery.

- **Step 15: End-to-End Marketing & CRM Verification**
  - Manually and programmatically verify the 5 primary test workflows:
    1. Lead Capture Form ➔ Contact created ➔ Opportunity added ➔ Email sent ➔ Task scheduled.
    2. Opportunity Stage Move ➔ Trigger fired ➔ Timeline logged.
    3. Calendar Appointment Booking ➔ Slot reserved ➔ Confirmation email.
    4. AI Lead Scoring ➔ Score returned ➔ Qualification recorded.
    5. Tenant Isolation Verification between Agency A and Agency B.

- **Step 16: Environment Variables Documentation**
  - Create `ENVIRONMENT_VARIABLES.md` detailing every configuration key without exposing secrets.

- **Step 17: Test Environment Documentation**
  - Create `TEST_ENVIRONMENT.md` with step-by-step setup guides for Supabase, Upstash, Resend, n8n, running the app locally, and resetting seed data.
  - Submit audit report and await user approval before executing implementation code changes.

---
*Audit completed by Senior Technical Architect & Lead Engineer.*
